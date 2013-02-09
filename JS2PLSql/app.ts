interface ISql {
    ToSql(): string;
}

class Column implements ISql {
    private columnName: string;
    get ColumnName(): string {
        return this.columnName;
    }

    get ColumnNameSql(): string {
        return this.ColumnName;
    }

    private isPK: bool;
    get IsPK(): bool { return this.isPK; }

    private isFK: bool;
    get IsFK(): bool { return this.isFK; }

    private fkRef: string;
    get FKTableName(): string {
        if (this.IsFK)
            return this.fkRef.split('.')[0];
        else
            return null;
    }
    get FKColumnName(): string {
        if (this.IsFK)
            return this.fkRef.split('.')[1];
        else
            return null;
    }

    IsIndexed: bool;

    IsNull: bool = true;

    Default: any;

    constructor(columnName: string) {
        this.columnName = columnName;
    }

    PK(): Column {
        this.isPK = true; return this;
    }

    FK(refTable: string, refColumn: string): Column {
        this.isFK = true;
        this.fkRef = refTable + '.' + refColumn;
        return this;
    }

    ToSql(): string { return ''; }
}

class NumberColumn extends Column {
    Scale: number;
    Precision: number;

    constructor(columnName: string, scale: number, precision: number = 0) {
        super(columnName);
        this.Scale = scale;
        this.Precision = precision;
    }

    ToSql(): string {
        var ret = this.ColumnName + ' NUMBER(' + this.Scale;

        if (this.Precision > 0)
            ret += ',' + this.Precision;

        ret += ')';

        return ret;
    }
}

class Varchar2Column extends Column {
    MaxLength: number;

    constructor(columnName: string, maxLen: number = 50) {
        super(columnName);
        this.MaxLength = maxLen;
    }

    ToSql() {
        return this.ColumnName + ' VARCHAR2(' + this.MaxLength + ')';
    }
}

class DateColumn extends Column {
    constructor(columnName: string) {
        super(columnName);
    }

    ToSql() {
        return this.ColumnName + ' DATE';
    }
}

class Table implements ISql {
    TableName: string;

    private columns: Column[] = new Array();
    get Columns(): Column[] {
        return this.columns;
    }
    SetColumns(cols: Column[]): Table {
        this.columns = cols; return this;
    }

    get ColsSql(): string {
        var ret = '';

        for (var i = 0; i < this.Columns.length; i++) {
            var col = this.Columns[i];
            ret += "\r\n\t" + col.ToSql();

            if (col.IsPK || !col.IsNull)
                ret += " NOT NULL";

            ret += ",";
        }

        return ret;
    }

    get PKSql(): string {
        var ret = '';

        for (var i = 0; i < this.Columns.length; i++) {
            var col = this.Columns[i];
            if (col.IsPK)
                ret += col.ColumnName + ",";
        }

        if (ret.length > 0)
            ret = '\r\n\tCONSTRAINT ' + this.TableName + '_PK PRIMARY KEY (' +
                ret.substring(0, ret.length - 1) + '),'

        return ret;
    }

    get FKSql(): string {
        var ret = '';

        for (var i = 0; i < this.Columns.length; i++) {
            var col = this.Columns[i];
            if (col.IsFK)
                ret += '\r\n\tCONSTRAINT ' + col.FKTableName + '_FK \r\n\t\tFOREIGN KEY (' +
                    col.ColumnName + ') \r\n\t\tREFERENCES ' + col.FKTableName + '(' +
                    col.FKColumnName + '),'
        }

        return ret;
    }

    constructor(tableName: string) {
        this.TableName = tableName;
    }

    ToSql(): string {
        var ret = "CREATE TABLE " + this.TableName + "(";

        // columns
        ret += this.ColsSql;

        // primary keys
        ret += this.PKSql;

        // foreign keys
        ret += this.FKSql;

        // removes last comma
        if (ret.substring(ret.length - 1) === ',')
            ret = ret.substring(0, ret.length - 1);

        ret += "\r\n);\r\n";

        return ret;
    }
}

class Builder {
    Tables: Table[] = new Array();

    constructor(tables: Table[]) { this.Tables = tables; }

    ToPLSql(): string {
        var ret = '';
        var constraints = '';

        for (var i = 0; i < this.Tables.length; i++) {
            var tbl = this.Tables[i];
            ret += tbl.ToSql();
        }

        return ret;
    }
}

window.onload = () => {
    var content = document.getElementById("content");

    var tables =
        [
            new Table("Customer").SetColumns(
            [
                new NumberColumn("CustomerID", 5).PK(),
                new Varchar2Column("CustomerNm", 30)
            ]),
            new Table("Product").SetColumns(
            [
                new NumberColumn("ProductID", 5).PK(),
                new Varchar2Column("ProductNm", 30)
            ]),
            new Table("CustomerOrder").SetColumns(
            [
                new NumberColumn("CustomerID", 5).FK("Customer", "CustomerID"),
                new NumberColumn("ProductID", 5).FK("Product", "ProductID"),
                new DateColumn("ShipDate")
            ])
        ];

    var bob = new Builder(tables);

    content.innerHTML = bob.ToPLSql();
};