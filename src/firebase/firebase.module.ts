import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseConfigService } from '../auth/firebase.config';

const firebaseAdminProvider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: () => {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(), // Asegúrate de que la configuración es correcta
    });
  },
};

@Module({
  providers: [FirebaseConfigService],
  exports: [FirebaseConfigService], 
})
export class FirebaseModule {}
