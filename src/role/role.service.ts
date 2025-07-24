import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './model/role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
	private readonly logger = new Logger(RoleService.name);

	constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

	async create(createRoleDto: CreateRoleDto): Promise<Role> {
		this.logger.log(`Creating role: ${createRoleDto.name}`);

		const existingRole = await this.roleModel.findOne({ name: createRoleDto.name });
		if (existingRole) {
			throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
		}

		const role = new this.roleModel(createRoleDto);
		return role.save();
	}

	async findAll(): Promise<Role[]> {
		this.logger.log('Finding all roles');
		return this.roleModel.find({ isActive: true }).populate('permissions').exec();
	}

	async findOne(id: string): Promise<Role> {
		this.logger.log(`Finding role by id: ${id}`);

		if (!Types.ObjectId.isValid(id)) {
			throw new NotFoundException(`Invalid role ID: ${id}`);
		}

		const role = await this.roleModel.findById(id).populate('permissions').exec();
		if (!role) {
			throw new NotFoundException(`Role with ID ${id} not found`);
		}
		return role;
	}

	async findByName(name: string): Promise<Role> {
		this.logger.log(`Finding role by name: ${name}`);
		const role = await this.roleModel.findOne({ name, isActive: true }).populate('permissions').exec();
		if (!role) {
			throw new NotFoundException(`Role with name '${name}' not found`);
		}
		return role;
	}

	async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
		this.logger.log(`Updating role with id: ${id}`);

		if (!Types.ObjectId.isValid(id)) {
			throw new NotFoundException(`Invalid role ID: ${id}`);
		}

		const role = await this.roleModel
			.findByIdAndUpdate(id, updateRoleDto, { new: true, runValidators: true })
			.populate('permissions')
			.exec();

		if (!role) {
			throw new NotFoundException(`Role with ID ${id} not found`);
		}
		return role;
	}

	async remove(id: string): Promise<Role> {
		this.logger.log(`Soft deleting role with id: ${id}`);

		if (!Types.ObjectId.isValid(id)) {
			throw new NotFoundException(`Invalid role ID: ${id}`);
		}

		const role = await this.roleModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();

		if (!role) {
			throw new NotFoundException(`Role with ID ${id} not found`);
		}
		return role;
	}

	async addPermissionToRole(roleId: string, permissionId: string): Promise<Role> {
		this.logger.log(`Adding permission ${permissionId} to role ${roleId}`);

		if (!Types.ObjectId.isValid(roleId) || !Types.ObjectId.isValid(permissionId)) {
			throw new NotFoundException('Invalid role or permission ID');
		}

		const role = await this.roleModel
			.findByIdAndUpdate(roleId, { $addToSet: { permissions: permissionId } }, { new: true })
			.populate('permissions')
			.exec();

		if (!role) {
			throw new NotFoundException(`Role with ID ${roleId} not found`);
		}
		return role;
	}

	async removePermissionFromRole(roleId: string, permissionId: string): Promise<Role> {
		this.logger.log(`Removing permission ${permissionId} from role ${roleId}`);

		if (!Types.ObjectId.isValid(roleId) || !Types.ObjectId.isValid(permissionId)) {
			throw new NotFoundException('Invalid role or permission ID');
		}

		const role = await this.roleModel
			.findByIdAndUpdate(roleId, { $pull: { permissions: permissionId } }, { new: true })
			.populate('permissions')
			.exec();

		if (!role) {
			throw new NotFoundException(`Role with ID ${roleId} not found`);
		}
		return role;
	}
}
