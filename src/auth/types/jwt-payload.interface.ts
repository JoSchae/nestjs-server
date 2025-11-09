export interface JwtPayload {
	/** User's email address */
	email: string;

	/** User ID (MongoDB ObjectId as string) */
	userId: string;

	/** Array of role names the user has (e.g., ['admin', 'user']) */
	roles: string[];

	/** Array of permission names from all user's roles (e.g., ['user:read', 'user:write']) */
	permissions: string[];

	/** Whether the user account is active */
	isActive: boolean;

	/** Token issued at timestamp (Unix timestamp in seconds) */
	iat?: number;

	/** Token expiration timestamp (Unix timestamp in seconds) */
	exp?: number;
}
