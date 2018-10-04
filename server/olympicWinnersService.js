import mysql from 'mysql';

const connection = mysql.createConnection({host: 'localhost', user: 'root', password: 'newrob12'});

class OlympicWinnersService {

  list(request, resultsCallback) {

    const rowGroupCols = request.rowGroupCols;
    const groupKeys = request.groupKeys;
    const valueCols = request.valueCols;
    const filterModel = request.filterModel;
    const sortModel = request.sortModel;

    const startRow = request.startRow;
    const endRow = request.endRow;
    const pageSize = endRow - startRow;

    const selectSql = this.createSelectSql(rowGroupCols, valueCols, groupKeys);
    const groupBySql = this.createGroupBySql(rowGroupCols, groupKeys);
    const whereSql = this.createWhereSql(rowGroupCols, groupKeys, filterModel);
    const orderBySql = this.createOrderBySql(sortModel);
    const limitSql = this.createLimitSql(startRow, pageSize);

    const sql = selectSql + ' from sample_data.olympic_winners ' + whereSql + groupBySql + orderBySql + limitSql;

    console.log('sql = ' + sql);
    const that = this;

    connection.query(sql, function (error, results) {
      const rowCount = that.getRowCount(startRow, pageSize, results);
      const resultsForPage = that.cutResultsToPageSize(pageSize, results);

      resultsCallback(resultsForPage, rowCount);
    });

  }

  createSelectSql(rowGroupCols, valueCols, groupKeys) {
    if (this.isDoingGrouping(rowGroupCols, groupKeys)) {
      const colsToSelect = [];

      const rowGroupCol = rowGroupCols[groupKeys.length];
      colsToSelect.push(rowGroupCol.field);

      valueCols.forEach(function (valueCol) {
        colsToSelect.push(valueCol.aggFunc + '(' + valueCol.field + ') as ' + valueCol.field);
      });

      return ' select ' + colsToSelect.join(', ');
    } else {
      // select all columns
      return ' select *';
    }
  }

  createFilterSql(key, item) {
    switch (item.filterType) {
      case 'text':
        return this.createTextFilterSql(key, item);
      case 'number':
        return this.createNumberFilterSql(key, item);
      default:
        console.log('unkonwn filter type: ' + item.filterType);
    }
  }

  createNumberFilterSql(key, item) {
    switch (item.type) {
      case 'equals':
        return key + ' = ' + item.filter;
      case 'notEqual':
        return key + ' != ' + item.filter;
      case 'greaterThan':
        return key + ' > ' + item.filter;
      case 'greaterThanOrEqual':
        return key + ' >= ' + item.filter;
      case 'lessThan':
        return key + ' < ' + item.filter;
      case 'lessThanOrEqual':
        return key + ' <= ' + item.filter;
      case 'inRange':
        return '(' + key + ' >= ' + item.filter + ' and ' + key + ' <= ' + item.filterTo + ')';
      default:
        console.log('unknown number filter type: ' + item.type);
        return 'true';
    }
  }

  createTextFilterSql(key, item) {
    switch (item.type) {
      case 'equals':
        return key + ' = "' + item.filter + '"';
      case 'notEqual':
        return key + ' != "' + item.filter + '"';
      case 'contains':
        return key + ' like "%' + item.filter + '%"';
      case 'notContains':
        return key + ' not like "%' + item.filter + '%"';
      case 'startsWith':
        return key + ' like "' + item.filter + '%"';
      case 'endsWith':
        return key + ' like "%' + item.filter + '"';
      default:
        console.log('unknown text filter type: ' + item.type);
        return 'true';
    }
  }

  createWhereSql(rowGroupCols, groupKeys, filterModel) {
    const that = this;
    const whereParts = [];

    if (groupKeys.length > 0) {
      groupKeys.forEach(function (key, index) {
        const colName = rowGroupCols[index].field;
        whereParts.push(colName + ' = "' + key + '"')
      });
    }

    if (filterModel) {
      const keySet = Object.keys(filterModel);
      keySet.forEach(function (key) {
        const item = filterModel[key];
        whereParts.push(that.createFilterSql(key, item));
      });
    }

    if (whereParts.length > 0) {
      return ' where ' + whereParts.join(' and ');
    } else {
      return '';
    }
  }

  createGroupBySql(rowGroupCols, groupKeys) {
    if (this.isDoingGrouping(rowGroupCols, groupKeys)) {
      const colsToGroupBy = [];

      const rowGroupCol = rowGroupCols[groupKeys.length];
      colsToGroupBy.push(rowGroupCol.field);

      return ' group by ' + colsToGroupBy.join(', ');
    } else {
      // select all columns
      return '';
    }
  }

  createOrderBySql(sortModel) {
    const sortParts = [];
    if (sortModel) {
      sortModel.forEach(function (item) {
        sortParts.push(item.colId + ' ' + item.sort);
      });
    }
    if (sortParts.length > 0) {
      return ' order by ' + sortParts.join(', ');
    } else {
      return '';
    }
  }

  isDoingGrouping(rowGroupCols, groupKeys) {
    // we are not doing grouping if at the lowest level. we are at the lowest level
    // if we are grouping by more columns than we have keys for (that means the user
    // has not expanded a lowest level group, OR we are not grouping at all).
    return rowGroupCols.length > groupKeys.length;
  }

  createLimitSql(startRow, pageSize) {
    return ' limit ' + (pageSize + 1) + ' offset ' + startRow;
  }

  getRowCount(startRow, pageSize, results) {
    // if no results (maybe an error, or user is seeking for a block well past
    // the possible blocks), then return null, which means we don't know what the
    // last row is. the user should never ask for a block that is past the last block,
    // but they could, for example, purge the cache, and since loading last time rows
    // have been removed from the server.
    if (results === null || results === undefined || results.length === 0) {
      return null;
    }

    // see how many rows we got back
    const rowCount = results.length;

    // if we got back more than the page size, then that means there are more rows
    // after this page, so we return null, as we can't work out the row count
    if (rowCount > pageSize) {
      return null;
    } else {
      // otherwise we have reached the end of the list, ie the last row is in
      // this block, so we can work out the exact row count
      return startRow + rowCount;
    }
  }

  cutResultsToPageSize(pageSize, results) {
    if (results && results.length > pageSize) {
      return results.splice(0, pageSize);
    } else {
      return results;
    }
  }
}

export default new OlympicWinnersService();