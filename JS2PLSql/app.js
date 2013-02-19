var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Sequence = (function () {
    function Sequence(seqName) {
        this.minVal = 1;
        this.maxVal = '999999999999999999999999999';
        this.startVal = 1;
        this.sequenceName = seqName;
    }
    Object.defineProperty(Sequence.prototype, "Name", {
        get: function () {
            return this.sequenceName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sequence.prototype, "SynonymSql", {
        get: function () {
            var ret = '';
            ret += '\r\nCREATE OR REPLACE PUBLIC SYNONYM ' + this.sequenceName + ' FOR ' + this.sequenceName;
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Sequence.prototype.ToSql = function () {
        var ret = '';
        ret += '\r\nCREATE SEQUENCE ' + this.sequenceName;
        ret += '\r\n\tSTART WITH ' + this.startVal;
        ret += '\r\n\tMAXVALUE ' + this.maxVal;
        ret += '\r\n\tMINVALUE ' + this.minVal;
        ret += '\r\n\tNOCYCLE';
        ret += '\r\n\tNOORDER';
        ret += '\r\n/';
        return ret;
    };
    return Sequence;
})();
var Column = (function () {
    function Column(columnName) {
        this.seq = null;
        this.IsNull = true;
        this.colNm = columnName;
    }
    Object.defineProperty(Column.prototype, "Name", {
        get: function () {
            return this.colNm;
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
        get: // eg. table.column
        function () {
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
    Object.defineProperty(Column.prototype, "Trigger", {
        get: function () {
            return this.trgNm;
        },
        enumerable: true,
        configurable: true
    });
    Column.prototype.SetTrigger = function (triggerName) {
        this.trgNm = triggerName;
        return this;
    };
    Object.defineProperty(Column.prototype, "Sequence", {
        get: function () {
            return this.seq;
        },
        enumerable: true,
        configurable: true
    });
    Column.prototype.SetSequence = function (sequenceName) {
        this.seq = new Sequence(sequenceName);
        return this;
    };
    Column.prototype.SetPK = function () {
        this.isPK = true;
        return this;
    };
    Column.prototype.SetFK = function (refTable, refColumn) {
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
        var ret = this.Name + ' NUMBER(' + this.Scale;
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
        return this.Name + ' VARCHAR2(' + this.MaxLength + ')';
    };
    return Varchar2Column;
})(Column);
var DateColumn = (function (_super) {
    __extends(DateColumn, _super);
    function DateColumn(columnName) {
        _super.call(this, columnName);
    }
    DateColumn.prototype.ToSql = function () {
        return this.Name + ' DATE';
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
                    ret += col.Name + ',';
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
                    ret += '\r\nALTER TABLE ' + this.TableName + '\r\n\tADD ' + col.FKTableName + '_FK' + '\r\n\t\tFOREIGN KEY (' + col.Name + ') \r\n\t\tREFERENCES ' + col.FKTableName + '(' + col.FKColumnName + ');';
                }
            }
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "SequenceSql", {
        get: function () {
            var ret = '';
            for(var i = 0; i < this.Columns.length; i++) {
                var col = this.Columns[i];
                if(col.Sequence != null) {
                    ret += col.Sequence.ToSql();
                }
            }
            ret += '\r\n';
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "SynonymSql", {
        get: function () {
            var ret = '';
            for(var i = 0; i < this.Columns.length; i++) {
                var col = this.Columns[i];
                if(col.Sequence != null) {
                    ret += col.Sequence.SynonymSql;
                }
            }
            ret += '\r\n';
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "TriggerSql", {
        get: function () {
            var ret = '';
            for(var i = 0; i < this.Columns.length; i++) {
                var col = this.Columns[i];
                if(col.Trigger != null) {
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "TableSql", {
        get: function () {
            var ret = 'CREATE TABLE ' + this.TableName + '(';
            // columns
            ret += this.ColsSql;
            // removes last comma
            if(ret.substring(ret.length - 1) === ',') {
                ret = ret.substring(0, ret.length - 1);
            }
            ret += '\r\n);\r\n';
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "ConstraintSql", {
        get: function () {
            var ret = '';
            ret += this.PKSql;
            ret += this.FKSql;
            ret += '\r\n';
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    return Table;
})();
var Builder = (function () {
    function Builder(tables) {
        this.Tables = [];
        this.Tables = tables;
    }
    Builder.prototype.ToPLSql = function () {
        var tables = '';
        var constraints = '';
        var sequences = '';
        var synonyms = '';
        var triggers = '';
        for(var i = 0; i < this.Tables.length; i++) {
            var tbl = this.Tables[i];
            tables += tbl.TableSql;
            constraints += tbl.ConstraintSql;
            sequences += tbl.SequenceSql;
            synonyms += tbl.SynonymSql;
            triggers += tbl.TriggerSql;
        }
        return tables + constraints + sequences + synonyms + triggers;
    };
    return Builder;
})();
window.onload = function () {
    var content = document.getElementById('content');
    var tables = [
        new Table('Customer').SetColumns([
            new NumberColumn('CustomerID', 5).SetSequence('CustomerID_Seq').SetTrigger("CustomerID_BI").SetPK(), 
            new Varchar2Column('CustomerNm', 30)
        ]), 
        new Table('Product').SetColumns([
            new NumberColumn('ProductID', 5).SetSequence('ProductID_Seq').SetTrigger("ProductID_BI").SetPK(), 
            new Varchar2Column('ProductNm', 30)
        ]), 
        new Table('CustomerOrder').SetColumns([
            new NumberColumn('CustomerID', 5).SetFK('Customer', 'CustomerID'), 
            new NumberColumn('ProductID', 5).SetFK('Product', 'ProductID'), 
            new DateColumn('ShipDate')
        ])
    ];
    var bob = new Builder(tables);
    content.innerHTML = bob.ToPLSql();
};
//@ sourceMappingURL=app.js.map
