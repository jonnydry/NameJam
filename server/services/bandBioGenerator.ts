import { BandBioGenerator } from './bandBio/bandBioGenerator';

export class BandBioGeneratorService {
  private generator: BandBioGenerator;

  constructor() {
    this.generator = new BandBioGenerator();
  }

  async generateBandBio(bandName: string, genre?: string, mood?: string): Promise<string> {
    return await this.generator.generateBandBio(bandName, genre, mood);
  }
}