import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { SupabaseService } from "../../config/supabase.service";
import { UserRole } from "@sisvac/types";
import { passportJwtSecret } from "jwks-rsa";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  cpf_validado: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${config.getOrThrow("NEXT_PUBLIC_SUPABASE_URL")}/auth/v1/jwk`,
      }),
      algorithms: ["RS256", "ES256"],
    });
  }

  async validate(payload: any): Promise<AuthenticatedUser> {
    const { data: profile } = await this.supabase.admin
      .from("profiles")
      .select("id, role, cpf_validado, ativo")
      .eq("id", payload.sub)
      .single();

    if (!profile || !profile.ativo) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: profile.role,
      cpf_validado: profile.cpf_validado,
    };
  }
}
