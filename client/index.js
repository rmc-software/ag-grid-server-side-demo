import {Grid} from 'ag-grid-community';
import 'ag-grid-enterprise';

import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";

const gridOptions = {
    columnDefs: [
        {field: 'athlete'},
        {field: 'country', rowGroup: true, hide: true},
        {field: 'sport', rowGroup: true, hide: true},
        {field: 'year'},
        {field: 'gold'},
        {field: 'silver'},
        {field: 'bronze'},
    ],

    rowModelType: 'serverSide',
    cacheBlockSize: 100,

    enableSorting: true,
    enableFilter: true,
    sideBar: true
};

const gridDiv = document.querySelector('#myGrid');
new Grid(gridDiv, gridOptions);

gridOptions.api.setServerSideDatasource({

    getRows(params) {
        const request = JSON.stringify(params.request, null, 1);
        log(request);


        fetch('./olympicWinners/', {
            method: 'post',
            body: request,
            headers: {"Content-Type": "application/json; charset=utf-8"}
        })
            .then(response => response.json())
            .then(res => params.successCallback(res.rows, res.lastRow));
    }
});

const log = (request) => console.log(JSON.stringify(request, null, 1));