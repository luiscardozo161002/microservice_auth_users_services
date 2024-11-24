import * as admin from 'firebase-admin';
import * as serviceAccount from '../../firebase-admin.json'; // Asegúrate de que la ruta es correcta
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class FirebaseConfigService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseConfigService.name);
  private firebaseApp: admin.app.App;

  onModuleInit() {
    // Asegúrate de que el objeto sea del tipo ServiceAccount
    const account = serviceAccount as admin.ServiceAccount;

    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(account),
    });

    this.logger.log('Firebase inicializado correctamente');
  }

  getFirebaseApp(): admin.app.App {
    return this.firebaseApp;
  }
}
