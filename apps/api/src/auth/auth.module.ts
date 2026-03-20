import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { SupabaseService } from "../config/supabase.service";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "jwt" })],
  providers: [JwtStrategy, SupabaseService],
  exports: [PassportModule],
})
export class AuthModule {}
