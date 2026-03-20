import { Test, TestingModule } from "@nestjs/testing";
import { AprovacoesService } from "./aprovacoes.service";
import { SupabaseService } from "../../config/supabase.service";
import { BadRequestException } from "@nestjs/common";
import { StatusSolicitacao, UserRole } from "@sisvac/types";

describe("AprovacoesService", () => {
  let service: AprovacoesService;
  let supabaseAdminMock: any;

  beforeEach(async () => {
    // 1. Cria a Lógica MOCK do Supabase
    supabaseAdminMock = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    };

    // 2. Ergue o módulo nativo do Nest injetando nosso "fake" SupabaseService
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AprovacoesService,
        {
          provide: SupabaseService,
          useValue: { admin: supabaseAdminMock },
        },
      ],
    }).compile();

    service = module.get<AprovacoesService>(AprovacoesService);
  });

  it("deve estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("Método Aprovar()", () => {
    it("deve rejeitar uma aprovação se a solicitação não for encontrada no banco", async () => {
      // Configuramos para a promessa de banco retornar null/erro no .single()
      supabaseAdminMock.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      // Esperamos que a chamada inteira EXPLODA um tipo BadRequestException
      await expect(
        service.aprovar("req-123", {}, "rh-id", UserRole.RH),
      ).rejects.toThrow(BadRequestException);

      // Checa se o método single() no supabase foi invocado corretamente.
      expect(supabaseAdminMock.single).toHaveBeenCalledTimes(1);
    });

    it("deve rejeitar uma aprovação se o status dela já não estiver como PENDENTE", async () => {
      // Se já estiver APROVADO, fingimos ser retornado pelo Supabase fake
      supabaseAdminMock.single.mockResolvedValueOnce({
        data: { id: "req-123", status: StatusSolicitacao.APROVADO },
        error: null,
      });

      await expect(
        service.aprovar("req-123", {}, "rh-id", UserRole.RH),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
