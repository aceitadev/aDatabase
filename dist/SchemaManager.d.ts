export declare class SchemaManager {
    private models;
    private changes;
    constructor(models: Function[]);
    migrate(): Promise<void>;
    private printMigrationSummary;
    private createTable;
    private updateTable;
    private getSchemaFromModel;
    private getSqlTypeForClass;
    private getExistingColumns;
}
