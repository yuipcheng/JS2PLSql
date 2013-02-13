var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Column = (function () {
    function Column(columnName) {
        this.IsNull = true;
        this.columnName = columnName;
    }
    Object.defineProperty(Column.prototype, "ColumnName", {
        get: function () {
            return this.columnName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Column.prototype, "ColumnNameSql", {
        get: function () {
            return this.ColumnName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Column.prototype, "IsPK", {
        get: function () {
            return this.isPK;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Column.prototype, "IsFK", {
        get: function () {
            return this.isFK;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Column.prototype, "FKTableName", {
        get: function () {
            if(this.IsFK) {
                return this.fkRef.split('.')[0];
            } else {
                return null;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Column.prototype, "FKColumnName", {
        get: function () {
            if(this.IsFK) {
                return this.fkRef.split('.')[1];
            } else {
                return null;
            }
        },
        enumerable: true,
        configurable: true
    });
    Column.prototype.PK = function () {
        this.isPK = true;
        return this;
    };
    Column.prototype.FK = function (refTable, refColumn) {
        this.isFK = true;
        this.fkRef = refTable + '.' + refColumn;
        return this;
    };
    Column.prototype.ToSql = function () {
        return '';
    };
    return Column;
})();
var NumberColumn = (function (_super) {
    __extends(NumberColumn, _super);
    function NumberColumn(columnName, scale, precision) {
        if (typeof precision === "undefined") { precision = 0; }
        _super.call(this, columnName);
        this.Scale = scale;
        this.Precision = precision;
    }
    NumberColumn.prototype.ToSql = function () {
        var ret = this.ColumnName + ' NUMBER(' + this.Scale;
        if(this.Precision > 0) {
            ret += ',' + this.Precision;
        }
        ret += ')';
        return ret;
    };
    return NumberColumn;
})(Column);
var Varchar2Column = (function (_super) {
    __extends(Varchar2Column, _super);
    function Varchar2Column(columnName, maxLen) {
        if (typeof maxLen === "undefined") { maxLen = 50; }
        _super.call(this, columnName);
        this.MaxLength = maxLen;
    }
    Varchar2Column.prototype.ToSql = function () {
        return this.ColumnName + ' VARCHAR2(' + this.MaxLength + ')';
    };
    return Varchar2Column;
})(Column);
var DateColumn = (function (_super) {
    __extends(DateColumn, _super);
    function DateColumn(columnName) {
        _super.call(this, columnName);
    }
    DateColumn.prototype.ToSql = function () {
        return this.ColumnName + ' DATE';
    };
    return DateColumn;
})(Column);
var Table = (function () {
    function Table(tableName) {
        this.columns = [];
        this.TableName = tableName;
    }
    Object.defineProperty(Table.prototype, "Columns", {
        get: function () {
            return this.columns;
        },
        enumerable: true,
        configurable: true
    });
    Table.prototype.SetColumns = function (cols) {
        this.columns = cols;
        return this;
    };
    Object.defineProperty(Table.prototype, "ColsSql", {
        get: function () {
            var ret = '';
            for(var i = 0; i < this.Columns.length; i++) {
                var col = this.Columns[i];
                ret += '\r\n\t' + col.ToSql();
                if(col.IsPK || !col.IsNull) {
                    ret += ' NOT NULL';
                }
                ret += ',';
            }
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "PKSql", {
        get: function () {
            var ret = '';
            for(var i = 0; i < this.Columns.length; i++) {
                var col = this.Columns[i];
                if(col.IsPK) {
                    ret += col.ColumnName + ',';
                }
            }
            if(ret.length > 0) {
                ret = '\r\nALTER TABLE ' + this.TableName + '\r\n\tADD CONSTRAINT ' + this.TableName + '_PK PRIMARY KEY (' + ret.substring(0, ret.length - 1) + ');';
            }
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "FKSql", {
        get: function () {
            var ret = '';
            for(var i = 0; i < this.Columns.length; i++) {
                var col = this.Columns[i];
                if(col.IsFK) {
                    ret += '\r\nALTER TABLE ' + this.TableName + '\r\n\tADD ' + col.FKTableName + '_FK \r\n\t\tFOREIGN KEY (' + col.ColumnName + ') \r\n\t\tREFERENCES ' + col.FKTableName + '(' + col.FKColumnName + ');';
                }
            }
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Table.prototype.GetTableSql = function () {
        var ret = 'CREATE TABLE ' + this.TableName + '(';
        // columns
        ret += this.ColsSql;
        // removes last comma
        if(ret.substring(ret.length - 1) === ',') {
            ret = ret.substring(0, ret.length - 1);
        }
        ret += '\r\n);\r\n';
        return ret;
    };
    Table.prototype.GetConstraintSql = function () {
        var ret = '';
        ret += this.PKSql;
        ret += this.FKSql;
        return ret;
    };
    return Table;
})();
var Builder = (function () {
    function Builder(tables) {
        this.Tables = [];
        this.Tables = tables;
    }
    Builder.prototype.ToPLSql = function () {
        var tableSql = '';
        var constraints = '';
        for(var i = 0; i < this.Tables.length; i++) {
            var tbl = this.Tables[i];
            tableSql += tbl.GetTableSql();
            constraints += tbl.GetConstraintSql();
        }
        return tableSql + constraints;
    };
    return Builder;
})();
window.onload = function () {
    var content = document.getElementById('content');
    var tables = [
        new Table('Customer').SetColumns([
            new NumberColumn('CustomerID', 5).PK(), 
            new Varchar2Column('CustomerNm', 30)
        ]), 
        new Table('Product').SetColumns([
            new NumberColumn('ProductID', 5).PK(), 
            new Varchar2Column('ProductNm', 30)
        ]), 
        new Table('CustomerOrder').SetColumns([
            new NumberColumn('CustomerID', 5).FK('Customer', 'CustomerID'), 
            new NumberColumn('ProductID', 5).FK('Product', 'ProductID'), 
            new DateColumn('ShipDate')
        ])
    ];
    var bob = new Builder(tables);
    content.innerHTML = bob.ToPLSql();
};
//@ sourceMappingURL=app.js.map
