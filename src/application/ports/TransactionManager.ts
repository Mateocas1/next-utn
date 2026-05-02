export interface TransactionManager {
  execute<T>(operation: (session: any) => Promise<T>): Promise<T>;
}
