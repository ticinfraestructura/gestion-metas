// Importar PrismaClient dinámicamente para evitar errores de importación
const { PrismaClient }: any = require('@prisma/client');
type PrismaClientType = any;
import { AppError, DatabaseError } from '@/shared/errors';

/**
 * Repositorio base genérico
 * Implementa el patrón Repository con tipos genéricos (DRY)
 */
export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  protected model: any;

  constructor(protected prisma: PrismaClientType, modelName: string) {
    // Dynamically get the model from Prisma client
    this.model = (prisma as any)[modelName];
    
    if (!this.model) {
      throw new Error(`Model ${modelName} not found in Prisma client`);
    }
  }

  /**
   * Create a new record
   */
  async create(data: CreateDto): Promise<T> {
    try {
      return await this.model.create({ data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
      throw new DatabaseError(`Failed to create record: ${errorMessage}`);
    }
  }

  /**
   * Find record by ID
   */
  async findById(id: number | string): Promise<T | null> {
    try {
      return await this.model.findUnique({ where: { id } });
    } catch (error) {
      throw new DatabaseError(`Failed to find record: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Find record by unique field
   */
  async findByUnique(where: any): Promise<T | null> {
    try {
      return await this.model.findUnique({ where });
    } catch (error) {
      throw new DatabaseError(`Failed to find record: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Find many records with optional filtering
   */
  async findMany(
    where: any = {},
    options: {
      orderBy?: any;
      include?: any;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<T[]> {
    try {
      const { orderBy, include, skip, take } = options;
      
      return await this.model.findMany({
        where,
        orderBy,
        include,
        skip,
        take
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to find records: ${(error as Error).message}`);
    }
  }

  /**
   * Update record by ID
   */
  async update(id: number | string, data: UpdateDto): Promise<T> {
    try {
      return await this.model.update({
        where: { id },
        data
      });
    } catch (error) {
      throw new DatabaseError(`Failed to update record: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Update record by unique field
   */
  async updateByUnique(where: any, data: UpdateDto): Promise<T> {
    try {
      return await this.model.update({
        where,
        data
      });
    } catch (error) {
      throw new DatabaseError(`Failed to update record: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id: number | string): Promise<T> {
    try {
      return await this.model.delete({ where: { id } });
    } catch (error) {
      throw new DatabaseError(`Failed to delete record: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Delete record by unique field
   */
  async deleteByUnique(where: any): Promise<T> {
    try {
      return await this.model.delete({ where });
    } catch (error) {
      throw new DatabaseError(`Failed to delete record: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(where: any = {}): Promise<number> {
    try {
      return await this.model.count({ where });
    } catch (error: any) {
      throw new DatabaseError(`Failed to count records: ${(error as Error).message}`);
    }
  }

  /**
   * Check if record exists
   */
  async exists(where: any): Promise<boolean> {
    try {
      const count = await this.model.count({ where });
      return count > 0;
    } catch (error: any) {
      throw new DatabaseError(`Failed to check existence: ${(error as Error).message}`);
    }
  }

  /**
   * Find first record matching criteria
   */
  async findFirst(
    where: any,
    options: {
      orderBy?: any;
      include?: any;
    } = {}
  ): Promise<T | null> {
    try {
      const { orderBy, include } = options;
      
      return await this.model.findFirst({
        where,
        orderBy,
        include
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to find first record: ${(error as Error).message}`);
    }
  }

  /**
   * Create many records
   */
  async createMany(data: CreateDto[]): Promise<{ count: number }> {
    try {
      return await this.model.createMany({ data });
    } catch (error: any) {
      throw new DatabaseError(`Failed to create multiple records: ${(error as Error).message}`);
    }
  }

  /**
   * Update many records
   */
  async updateMany(
    where: any,
    data: UpdateDto
  ): Promise<{ count: number }> {
    try {
      return await this.model.updateMany({ where, data });
    } catch (error: any) {
      throw new DatabaseError(`Failed to update multiple records: ${(error as Error).message}`);
    }
  }

  /**
   * Delete many records
   */
  async deleteMany(where: any): Promise<{ count: number }> {
    try {
      return await this.model.deleteMany({ where });
    } catch (error: any) {
      throw new DatabaseError(`Failed to delete multiple records: ${(error as Error).message}`);
    }
  }
}
