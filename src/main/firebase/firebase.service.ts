// import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
// import * as admin from 'firebase-admin';


// @Injectable()
// export class FirebaseService implements OnModuleInit {
//     onModuleInit() {
//         if (!admin.apps.length) {
//             const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
//                 ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
//                 : null;
//             if (serviceAccount) {
//                 admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
//             } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
//                 admin.initializeApp();
//             } else {
//                 throw new BadRequestException('Firebase service account not provided');
//             }
//         }
//     }


//     async verifyToken(idToken: string) {
//         try {
//             return await admin.auth().verifyIdToken(idToken);
//         } catch (err) {
//             throw new BadRequestException('Invalid Firebase ID token');
//         }
//     }
// }