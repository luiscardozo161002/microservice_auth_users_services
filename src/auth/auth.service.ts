import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { FirebaseConfigService } from '../auth/firebase.config'; // Asegúrate de importar el servicio
import * as admin from 'firebase-admin';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Se usa el service de micro_auth (userService)
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly firebaseConfigService: FirebaseConfigService, // Inyección correcta aquí
    private configService: ConfigService,
  ) {}

  // Registro de usuario
  /*async register({
    username,
    email,
    password,
  }: RegisterDto): Promise<{ username: string; email: string }> {
    const user = await this.userService.findOneByEmail(email);

    if (user) {
      throw new BadRequestException('El usuario ya existe.');
    }

    await this.userService.create({
      username,
      email,
      password: await bcryptjs.hash(password, 10),
    });

    return {
      username,
      email,
    };
  } */

  // Registro de usuario
  async register({
    username,
    email,
    password,
  }: RegisterDto): Promise<{ username: string; email: string }> {
    // Verificar si el usuario ya existe en PostgreSQL
    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) {
      throw new BadRequestException('El usuario ya existe.');
    }

    // Crear el usuario en Firebase Authentication
    try {
      const hashedPassword = await bcryptjs.hash(password, 10); // Hashear la contraseña para PostgreSQL
      const firebaseApp = this.firebaseConfigService.getFirebaseApp();

      // Registrar el usuario en Firebase Authentication
      const firebaseUser = await firebaseApp.auth().createUser({
        email,
        password, // En Firebase puedes guardar la contraseña sin hash
        displayName: username,
      });

      // Registrar el usuario en PostgreSQL
      await this.userService.create({
        username,
        email,
        password: hashedPassword,
        firebaseUid: firebaseUser.uid, // Guardar el UID de Firebase
      });

      // Retornar información del usuario
      return {
        username,
        email,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al registrar al usuario en Firebase: ${error.message}`,
      );
    }
  }

  // Login de usuario
  async login({
    email,
    password,
  }: LoginDto): Promise<{ token: string; email: string }> {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('El correo no es válido.');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña no es válida.');
    }

    const payload = { email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      email,
    };
  }

  // Obtener el perfil del usuario
  async profile({
    email,
    role,
  }: {
    email: string;
    role: string;
  }): Promise<any> {
    const user = await this.userService.findOneByEmail(email);
    return user;
  }

  // Método para solicitar restauración de contraseña
  /* async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    try {
      const firebaseApp = this.firebaseConfigService.getFirebaseApp();

      // Verificar si el correo existe en Firebase Authentication
      try {
        await firebaseApp.auth().getUserByEmail(email);
      } catch (error) {
        this.logger.error(`El correo ${email} no está registrado en Firebase.`);
        throw new BadRequestException('El correo no está registrado.');
      }

      // Generar el enlace de restablecimiento de contraseña
      const resetLink = await firebaseApp
        .auth()
        .generatePasswordResetLink(email);
      this.logger.log(`Enlace generado para ${email}: ${resetLink}`);

      // Opcional: aquí puedes enviar manualmente el enlace si deseas un control más detallado
      // Ejemplo: enviar a un servicio de email personalizado

      // Log de éxito
      this.logger.log(`Correo de restablecimiento enviado a ${email}`);
    } catch (error) {
      this.logger.error(
        `Error enviando el correo de restablecimiento para ${email}: ${error.message}`,
      );
      throw new BadRequestException(
        'No se pudo enviar el correo de restablecimiento.',
      );
    }
  } */

  async forgotPassword({ email }: ForgotPasswordDto) {
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.configService.get<string>('FIREBASE_API_KEY')}`,
        { requestType: 'PASSWORD_RESET', email,  continueUrl: 'http://localhost:3000/api/v1/auth/forgot-password', },
      );

      if (response.status === 200) {
        this.logger.log(`Correo de restablecimiento enviado a: ${email}`);
        return { message: 'Correo enviado correctamente.' };
      }
    } catch (error) {
      this.logger.error(`Error en forgotPassword: ${error.message}`);
      if (error.response && error.response.data) {
        const firebaseError = error.response.data.error.message;
        const errorMessage =
          firebaseError === 'EMAIL_NOT_FOUND'
            ? 'El correo no está registrado.'
            : 'Error al procesar la solicitud.';
        throw new BadRequestException(errorMessage);
      }
      throw new BadRequestException('Error desconocido.');
    }
  }

  async resetPassword(oobCode: string, resetPasswordDto: ResetPasswordDto) {
    const { newPassword } = resetPasswordDto;

    try {
      // Verificar el token en Firebase
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${this.configService.get<string>('FIREBASE_API_KEY')}`,
        {
          oobCode: oobCode, // Usamos el token de la URL
        },
      );

      const email = response.data.email; // Obtenemos el correo asociado al token

      // Buscar al usuario en PostgreSQL
      const user = await this.userService.findOneByEmail(email);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado.');
      }

      // Hashear la nueva contraseña
      const hashedPassword = await bcryptjs.hash(newPassword, 10);

      // Actualizar la contraseña en PostgreSQL
      await this.userService.updatePassword(user.id, hashedPassword);

      return { message: 'Contraseña actualizada correctamente.' };
    } catch (error) {
      throw new BadRequestException('Token inválido o expirado.');
    }
  }

      // Restablecimiento de la contraseña
  /*async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    try {
      const firebaseApp = this.firebaseConfigService.getFirebaseApp(); // Usamos el servicio inyectado
      const decodedToken = await firebaseApp.auth().verifyIdToken(token); // Verifica el token

      const uid = decodedToken.uid; // Obtén el UID del usuario

      // Actualiza la contraseña en Firebase
      await firebaseApp.auth().updateUser(uid, { password });

      // Actualiza la contraseña en la base de datos PostgreSQL
      const user = await this.userService.findOneByFirebaseUid(uid);
      if (!user) {
        throw new BadRequestException(
          'Usuario no encontrado en la base de datos.',
        );
      }

      // Hashea la nueva contraseña antes de guardarla en la base de datos
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Actualiza la contraseña en PostgreSQL
      await this.userService.updatePassword(user.id, hashedPassword);

      this.logger.log(
        'Contraseña restablecida correctamente en Firebase y PostgreSQL',
      );
    } catch (error) {
      this.logger.error(`Error restableciendo la contraseña: ${error.message}`);
      throw new BadRequestException('Token inválido o expirado.');
    }
  }*/

}
