import mysql from 'mysql';

const connection = mysql.createConnection({host: 'localhost', user: 'root', password: 'newrob12'});

export function fetchRows(args, resultCallback) {
  connection.query(buildSql(args), resultCallback);
}

const buildSql = (args) => {
  // console.log(args);

  let SQL = select(args) + from() + where(args) + groupBy(args) + orderBy(args) + limit(args);

  console.log(`${SQL}`);

  return SQL;
};

const select = args => {
  if (args.rowGroups && args.rowGroups.length > 0) {
    const numGroupKeys = args.groupKeys ? args.groupKeys.length : 0;
    let groupsToUse = args.rowGroups.slice(numGroupKeys, numGroupKeys + 1);
    if (groupsToUse.length > 0) {
      let dimensions = groupsToUse.map(group => group.field).join(", ");
      let measures = '';
      if (args.valueColumns) {
        measures = ', ' + args.valueColumns.map(c => `${c.aggFunc}(${c.field}) as ${c.field}`).join(', ');
      }

      return `SELECT ${dimensions} ${measures}`;
    }
  }
  return 'SELECT *';
};

const from = () => ' FROM sample_data.olympic_winners';

const where = (args) => {
  let rowGroups = args.rowGroups;
  let groupKeys = args.groupKeys;
  let whereClause = '';
  if (groupKeys && groupKeys.length > 0) {
    for (let i = 0; i < groupKeys.length; i++) {
      whereClause += (i === 0) ? ' WHERE ' : ' AND ';
      whereClause += `${rowGroups[i].field} = '${groupKeys[i]}'`;
    }
  }
  return whereClause;
};

const groupBy = (args) => {
  let groupBy = '';
  if (args.rowGroups && args.rowGroups.length > 0) {
    const numGroupKeys = args.groupKeys ? args.groupKeys.length : 0;
    let groupsToUse = args.rowGroups.slice(numGroupKeys, numGroupKeys + 1);
    if (groupsToUse.length > 0) {
      groupBy += ' GROUP BY ' + groupsToUse.map(group => group.field).join(", ");
    }
  }
  return groupBy;
};

const orderBy = (args) => {
  if (args.sorting && args.sorting.length > 0) {
    return ' ORDER BY ' + args.sorting.map(s => `${s.colId} ${s.sort}`).join(', ');
  }
  return '';
};

const limit = (args) => {
  if (args.endRow) {
    let pageSize = args.endRow - args.startRow;
    return ` LIMIT ${args.startRow}, ${pageSize + 1}`;
  }
  return '';
};
