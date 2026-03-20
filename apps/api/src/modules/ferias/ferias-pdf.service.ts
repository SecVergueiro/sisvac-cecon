import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class FeriasPdfService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async gerarGuia(id: string): Promise<Buffer> {
    const supabase = this.supabaseService.admin;

    const { data: sol, error } = await supabase
      .from('vw_solicitacoes_detalhadas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !sol) {
      throw new NotFoundException('Solicitação de Férias não encontrada para emissão.');
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Desenho do PDF
      doc.fontSize(22).font('Helvetica-Bold').text('GUIA DE FÉRIAS REGULAMENTARES', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica').text('GOVERNO DO ESTADO DO AMAZONAS', { align: 'center' });
      doc.text('Fundação Centro de Controle de Oncologia do Estado do Amazonas - FCECON', { align: 'center' });
      doc.moveDown(3);

      doc.fontSize(14).font('Helvetica-Bold').text('1. DADOS DO SERVIDOR');
      doc.rect(50, doc.y + 5, 495, 75).stroke();
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica').text(`    Nome: ${sol.servidor_nome}`);
      doc.text(`    Matrícula: ${sol.servidor_matricula}            CPF: ${sol.servidor_cpf}`);
      doc.text(`    Cargo: ${sol.servidor_cargo || 'Não informado'}            Setor: ${sol.servidor_setor || 'Não informado'}`);
      doc.moveDown(3);

      doc.fontSize(14).font('Helvetica-Bold').text('2. DETALHES DO AFASTAMENTO');
      doc.rect(50, doc.y + 5, 495, 80).stroke();
      doc.moveDown(1);
      
      const formatar = (isoDate: string) => {
        if (!isoDate) return 'N/A';
        const d = new Date(isoDate);
        return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      };

      doc.fontSize(11).font('Helvetica').text(`    Exercício de Referência: ${sol.exercicio}`);
      doc.text(`    Período de Gozo: de ${formatar(sol.data_inicio)} a ${formatar(sol.data_fim)} (${sol.dias_solicitados} dias)`);
      doc.text(`    Tipo de Afastamento: ${sol.tipo_afastamento.replace(/_/g, ' ')}`);
      doc.text(`    Fracionamento: ${sol.tipo_fracionamento.replace(/_/g, ' ').replace('DEZ', '10').replace('VINTE', '20').replace('QUINZE', '15')}`);
      doc.moveDown(4);

      // Assinaturas
      const yAssinaturas = doc.y + 40;
      doc.text('___________________________________________', 60, yAssinaturas);
      doc.text('Assinatura do Servidor', 60, yAssinaturas + 15, { width: 230, align: 'center' });
      
      doc.text('___________________________________________', 300, yAssinaturas);
      doc.text('Visto da Chefia Imediata', 300, yAssinaturas + 15, { width: 230, align: 'center' });

      doc.moveDown(4);
      doc.fontSize(9).fillColor('grey').text(`Documento gerado eletronicamente pelo SISVAC em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}.`, 50, doc.page.height - 70, { align: 'center' });

      doc.end();
    });
  }
}
