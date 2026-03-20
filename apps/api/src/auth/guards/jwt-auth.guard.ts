import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  CanActivate,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/index";
import { SupabaseService } from "../../config/supabase.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token não fornecido ou inválido");
    }

    const token = authHeader.split(" ")[1];

    // Bypass Passport: Valida o token usando a API Nativa do Supabase
    const {
      data: { user },
      error,
    } = await this.supabase.admin.auth.getUser(token);

    if (error || !user) {
      console.error("[JwtAuthGuard] Token inválido:", error?.message);
      throw new UnauthorizedException("Sua sessão expirou ou é inválida.");
    }

    const { data: profile } = await this.supabase.admin
      .from("profiles")
      .select("id, role, cpf_validado, ativo")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.ativo) {
      console.error("[JwtAuthGuard] Perfil nulo ou inativo para id:", user.id);
      throw new UnauthorizedException("Seu perfil está inativo no banco.");
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      cpf_validado: profile.cpf_validado,
    };

    return true;
  }
}
