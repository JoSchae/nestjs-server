import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class MongoSanitizePipe implements PipeTransform {
	/**
	 * Sanitize input to prevent NoSQL injection attacks
	 * Removes MongoDB operators like $where, $ne, $gt, etc.
	 */
	transform(value: any, metadata: ArgumentMetadata) {
		if (value && typeof value === 'object') {
			return this.sanitize(value);
		}
		return value;
	}

	private sanitize(obj: any): any {
		if (obj === null || obj === undefined) {
			return obj;
		}

		// Handle arrays
		if (Array.isArray(obj)) {
			return obj.map((item) => this.sanitize(item));
		}

		// Handle objects
		if (typeof obj === 'object') {
			const sanitized: any = {};

			for (const key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key)) {
					// ✅ Block MongoDB operators (anything starting with $)
					if (key.startsWith('$')) {
						throw new BadRequestException(
							`Invalid input: MongoDB operators are not allowed (found: ${key})`,
						);
					}

					// ✅ Recursively sanitize nested objects
					sanitized[key] = this.sanitize(obj[key]);
				}
			}

			return sanitized;
		}

		return obj;
	}
}
