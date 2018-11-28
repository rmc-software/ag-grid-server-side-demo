import {Grid} from 'ag-grid-community';
import 'ag-grid-enterprise';

import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";

const gridOptions = {
    columnDefs: [
        {field: 'athlete'},
        {field: 'country'},
        {field: 'sport'},
        {field: 'year'},
        {field: 'gold'},
        {field: 'silver'},
        {field: 'bronze'},
    ],

    rowModelType: 'serverSide',
    cacheBlockSize: 100,
    maxBlocksInCache: 50
};

const gridDiv = document.querySelector('#myGrid');
new Grid(gridDiv, gridOptions);

const datasource = {
    getRows(params) {

        console.log(JSON.stringify(params.request, null, 1));

        fetch('./olympicWinners/', {
            method: 'post',
            body: JSON.stringify(params.request),
            headers: {"Content-Type": "application/json; charset=utf-8"}
        })
        .then(httpResponse => httpResponse.json())
        .then(response => {
            params.successCallback(response.rows, response.lastRow);
        })
        .catch(error => {
            console.error(error);
            params.failCallback();
        })
    }
};

gridOptions.api.setServerSideDatasource(datasource);