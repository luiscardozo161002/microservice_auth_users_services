import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
    });
  }

  async findOne(id: string): Promise<User> { 
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });
    if (!user) {
      throw new NotFoundException(`El usuario con el ID: ${id} no encontrado.`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findOneByEmail(email: string){
    return this.userRepository.findOneBy({email})
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> { // Cambiado a string
    const user = await this.findOne(id);
    const updatedUser = this.userRepository.merge(user, updateUserDto);
    return this.userRepository.save(updatedUser);
  }

  async remove(id: string): Promise<{ message: string }> { // Cambiado a string
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
    return { message: `El usuario con el ID ${id} fue eliminado correctamente.` };
  }

  // Metodo para buscar el uid del usuario
  async findOneByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { firebaseUid },  // Buscamos por el UID de Firebase
    });
  }
  
  //Metodo para actualizar la contraseña del usuario mediante firebase
  async updatePassword(id: string, newPassword: string): Promise<void> {
    // Asegúrate de que la contraseña sea hasheada antes de guardarla
    await this.userRepository.update(id, { password: newPassword });
  }  
}
