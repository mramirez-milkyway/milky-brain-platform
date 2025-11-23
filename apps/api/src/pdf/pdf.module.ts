import { Module } from '@nestjs/common'
import { PdfKitGeneratorService } from './pdfkit-generator.service'
import { IPdfGenerator } from './interfaces/pdf-generator.interface'

@Module({
  providers: [
    {
      provide: 'IPdfGenerator',
      useClass: PdfKitGeneratorService,
    },
    PdfKitGeneratorService,
  ],
  exports: ['IPdfGenerator', PdfKitGeneratorService],
})
export class PdfModule {}
