interface ISql {
    ToSql(): string;
}

class Sequence implements ISql {
    private sequenceName: string;
    get Name(): string {
        return this.sequenceName;
    }
    private minVal: number = 1;
    private maxVal: string = '999999999999999999999999999';
    private startVal: number = 1;


    constructor(seqName: string) {
        this.sequenceName = seqName;
    }

    get SynonymSql(): string {
        var ret = '';
        ret += '\r\nCREATE OR REPLACE PUBLIC SYNONYM ' + this.sequenceName + ' FOR ' + this.sequenceName;
        return ret;
    }

    ToSql(): string {
        var ret = '';
        ret += '\r\nCREATE SEQUENCE ' + this.sequenceName;
        ret += '\r\n\tSTART WITH ' + this.startVal;
        ret += '\r\n\tMAXVALUE ' + this.maxVal;
        ret += '\r\n\tMINVALUE ' + this.minVal;
        ret += '\r\n\tNOCYCLE';
        ret += '\r\n\tNOORDER';
        ret += '\r\n/';
        return ret;
    }
}

class Column implements ISql {
    private colNm: string;
    get Name(): string {
        return this.colNm;
    }

    private isPK: bool;
    get IsPK(): bool { return this.isPK; }

    private isFK: bool;
    get IsFK(): bool { return this.isFK; }

    private fkRef: string; // eg. table.column
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

    private trgNm: string;
    get Trigger(): string {
        return this.trgNm;
    }
    SetTrigger(triggerName: string): Column {
        this.trgNm = triggerName;
        return this;
    }

    private seq: Sequence = null;
    get Sequence(): Sequence {
        return this.seq;
    }
    SetSequence(sequenceName: string): Column {
        this.seq = new Sequence(sequenceName);
        return this;
    }

    IsNull: bool = true;

    Default: any;

    constructor(columnName: string) {
        this.colNm = columnName;
    }

    SetPK(): Column {
        this.isPK = true;
        return this;
    }

    SetFK(refTable: string, refColumn: string): Column {
        this.isFK = true;
        this.fkRef = refTable + '.' + refColumn;
        return this;
    }

    ToSql(): string { return ''; }
}

class NumberColumn extends Column {
    Scale: number;
    Precision: number;

    private seq: Sequence;

    constructor(columnName: string, scale: number, precision: number = 0) {
        super(columnName);
        this.Scale = scale;
        this.Precision = precision;
    }

    ToSql(): string {
        var ret = this.Name + ' NUMBER(' + this.Scale;

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
        return this.Name + ' VARCHAR2(' + this.MaxLength + ')';
    }
}

class DateColumn extends Column {
    constructor(columnName: string) {
        super(columnName);
    }

    ToSql() {
        return this.Name + ' DATE';
    }
}

class Table {
    TableName: string;

    private columns: Column[] = [];
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
            ret += '\r\n\t' + col.ToSql();
            if (col.IsPK || !col.IsNull)
                ret += ' NOT NULL';
            ret += ',';
        }
        return ret;
    }

    get PKSql(): string {
        var ret = '';
        for (var i = 0; i < this.Columns.length; i++) {
            var col = this.Columns[i];
            if (col.IsPK)
                ret += col.Name + ',';
        }
        if (ret.length > 0)
            ret = '\r\nALTER TABLE ' + this.TableName +
                '\r\n\tADD CONSTRAINT ' + this.TableName + '_PK PRIMARY KEY (' + ret.substring(0, ret.length - 1) + ');'
        return ret;
    }

    get FKSql(): string {
        var ret = '';
        for (var i = 0; i < this.Columns.length; i++) {
            var col = this.Columns[i];
            if (col.IsFK)
                ret += '\r\nALTER TABLE ' + this.TableName +
                    '\r\n\tADD ' + col.FKTableName + '_FK' +
                    '\r\n\t\tFOREIGN KEY (' + col.Name + ') \r\n\t\tREFERENCES ' + col.FKTableName + '(' +  col.FKColumnName + ');'
        }
        return ret;
    }

    get SequenceSql(): string {
        var ret = '';
        for (var i = 0; i < this.Columns.length; i++) {
            var col = this.Columns[i];
            if (col.Sequence != null)
                ret += col.Sequence.ToSql();
        }
        ret += '\r\n';
        return ret;
    }

    get SynonymSql(): string {
        var ret = '';
        for (var i = 0; i < this.Columns.length; i++) {
            var col = this.Columns[i];
            if (col.Sequence != null)
                ret += col.Sequence.SynonymSql;
        }
        ret += '\r\n';
        return ret;
    }

    get TriggerSql(): string {
        var ret = '';
        for (var i = 0; i < this.Columns.length; i++) {
            var col = this.Columns[i];
            if (col.Trigger != null) {
                ret += '\r\nCREATE OR REPLACE TRIGGER ' + col.Name;
                ret += '\r\n\tBEFORE INSERT';
                ret += '\r\n\tON ' + this.TableName;
                ret += '\r\n\tFOR EACH ROW';
                ret += '\r\n\tBEGIN';
                ret += '\r\n\t\tIF: NEW.' + col.Name + ' IS NULL';
                ret += '\r\n\t\tTHEN';
                ret += '\r\n\t\t\tSELECT ' + col.Sequence.Name + '.NEXTVAL INTO: NEW.' + col.Name + ' FROM DUAL;';
                ret += '\r\n\t\tEND IF;';
                ret += '\r\nEND;';
                ret += '\r\n/';
            }
        }
        ret += '\r\n';
        return ret;
    }

    get TableSql(): string {
        var ret = 'CREATE TABLE ' + this.TableName + '(';

        // columns
        ret += this.ColsSql;

        // removes last comma
        if (ret.substring(ret.length - 1) === ',')
            ret = ret.substring(0, ret.length - 1);

        ret += '\r\n);\r\n';

        return ret;
    }

    get ConstraintSql(): string {
        var ret = '';
        ret += this.PKSql;
        ret += this.FKSql;
        ret += '\r\n';
        return ret;
    }

    constructor(tableName: string) {
        this.TableName = tableName;
    }
}

class Builder {
    Tables: Table[] = [];

    constructor(tables: Table[]) { this.Tables = tables; }

    ToPLSql(): string {
        var tables = '';
        var constraints = '';
        var sequences = '';
        var synonyms = '';
        var triggers = '';

        for (var i = 0; i < this.Tables.length; i++) {
            var tbl = this.Tables[i];

            tables += tbl.TableSql;
            constraints += tbl.ConstraintSql;
            sequences += tbl.SequenceSql;
            synonyms += tbl.SynonymSql;
            triggers += tbl.TriggerSql;
        }

        return tables + constraints + sequences + synonyms + triggers;
    }
}

window.onload = () => {
    var content = document.getElementById('content');

    var tables =
        [
            new Table('Customer').SetColumns(
            [
                new NumberColumn('CustomerID', 5).SetSequence('CustomerID_Seq').SetTrigger("CustomerID_BI").SetPK(),
                new Varchar2Column('CustomerNm', 30)
            ]),
            new Table('Product').SetColumns(
            [
                new NumberColumn('ProductID', 5).SetSequence('ProductID_Seq').SetTrigger("ProductID_BI").SetPK(),
                new Varchar2Column('ProductNm', 30)
            ]),
            new Table('CustomerOrder').SetColumns(
            [
                new NumberColumn('CustomerID', 5).SetFK('Customer', 'CustomerID'),
                new NumberColumn('ProductID', 5).SetFK('Product', 'ProductID'),
                new DateColumn('ShipDate')
            ])
        ];

    var bob = new Builder(tables);

    content.innerHTML = bob.ToPLSql();
};