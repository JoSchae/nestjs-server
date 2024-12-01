import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { StudentSchema } from './schema/student.schema';
import { StudentService } from './student/student.service';
import { StudentController } from './student/student.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import mongodbConfig from './shared/config/mongodb.config';

@Module({
	imports: [
		ConfigModule.forRoot({
			// envFilePath: ['.env'],
			// isGlobal: true,
			load: [mongodbConfig],
		}),
		EventsModule,
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('mongodb.uri'),
			}),
			inject: [ConfigService],
		}),
		MongooseModule.forFeature([{ name: 'Student', schema: StudentSchema }]),
		AuthModule,
		UsersModule,
	],
	controllers: [AppController, StudentController],
	providers: [AppService, StudentService],
})
export class AppModule {}
