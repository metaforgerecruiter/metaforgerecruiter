import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/** Attach a stored permission key (roles_permissions.permissions[]) to a handler. */
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
