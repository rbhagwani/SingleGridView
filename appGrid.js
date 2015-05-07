// create a module for our Angular app with a dependency on our angularMscrm module
var CrmApp = angular.module('singleGridViewModule', ['angularDynamicsCRM', 'smart-table']);

// create a controller for the single grid view, and inject our CrmService into it
CrmApp.controller('SingleGridController', function ($scope, DynamicsCRMService) {


    $scope.init = function () {
        $scope.gridData = [];
        $scope.gridData.rows = [];
        $scope.gridData.cols = [];
        $scope.childEntities = [];
    };
    $scope.init();

    //Get the grid configuration details...
    var gridQuery = "grd_gridname,grd_noofcols,grd_primaryentity,grd_primaryentitymetadataname,grd_singlegridviewId,grd_grd_singlegridview_grd_columnnameconfigur/grd_colname&$expand=grd_grd_singlegridview_grd_columnnameconfigur"
    gridQuery += "&$filter=grd_gridname eq'Test' and statecode/Value eq 0";
    
    DynamicsCRMService.queryCrm(
        { entitySet: 'grd_singlegridviewSet', primaryKey: 'grd_singlegridviewId', filterQuery: gridQuery },
        function (response) {
            //assign the results to $scope
            var data = response.d;
            this.createGridConfig($scope, data.results);
        });

    //Get the child entities details 
    var childEntityQry = "grd_entitymetadataname,grd_entityname,grd_nameattribute,grd_nameattributemetadataname,grd_primaryentitylookupattribute,grd_primarykeyattributemetadataname,grd_primarykeyattributename,"
    childEntityQry += "grd_grd_singlegridviewchildentity_grd_childen/grd_attributelabel,grd_grd_singlegridviewchildentity_grd_childen/grd_attributemetadataname,grd_grd_singlegridviewchildentity_grd_childen/grd_attributetype,grd_grd_singlegridviewchildentity_grd_childen/grd_columngridid&$expand=grd_grd_singlegridviewchildentity_grd_childen"
    childEntityQry += "&$filter=grd_gridviewid/Id eq guid'4778d146-8cf3-e411-8029-080027d2e151'and statecode/Value eq 0";


    //child entities
    DynamicsCRMService.queryCrm(
        { entitySet: 'grd_singlegridviewchildentitySet', primaryKey: 'grd_singlegridviewchildentityId', filterQuery: childEntityQry },
        function (response) {
            // assign the results to $scope
            var data = response.d;
            if (data.results != null && data.results.length > 0) {
                $scope.childEntities = data.results;
                $scope.getChildEntitiesData();
            }
        });

    $scope.getChildEntitiesData = function () {
        var childEntityRetireveQry = '';
        var childCols = [];
        for (var i = 0; i < $scope.childEntities.length; i++) {
            if ($scope.childEntities[i].grd_grd_singlegridviewchildentity_grd_childen.results.length > 0) {
                childCols = $scope.childEntities[i].grd_grd_singlegridviewchildentity_grd_childen.results;

                for (var colNo = 0; colNo < childCols.length; colNo++) {
                    childEntityRetireveQry += childCols[colNo]["grd_attributemetadataname"] + ",";
                }
                childEntityRetireveQry += $scope.childEntities[i]["grd_nameattributemetadataname"]; //Add the name attribute...

                childEntityRetireveQry += "&filter=" + $scope.childEntities[i]["grd_primaryentitylookupattribute"] + "/Id eq guid '" + 'A168EEE2-72F4-E411-8029-080027D2E151' + "' and statecode/Value eq 0";  //Replace hardcoded guid with the XRM method...

                DynamicsCRMService.queryCrm(
                { entitySet: $scope.childEntities[i]["grd_entitymetadataname"] + 'Set', primaryKey: $scope.childEntities[i]["grd_entitymetadataname"] + 'Id', filterQuery: childEntityRetireveQry },
                function (response) {
                    // assign the results to $scope
                    var data = response.d;
                    if (data.results != null && data.results.length > 0) {
                        var entitymetadataname =  data.results[0].__metadata.type.substr(data.results[0].__metadata.type.lastIndexOf(".") + 1)
                        this.addResultsToGrid(data.results, $scope, childCols, entitymetadataname + 'Id', entitymetadataname);
                    }
                });
            }
        }
    }

    $scope.openChildEntity = function (entityname, primaryid) {
        parent.Xrm.Utility.openEntityForm(entityname, primaryid);
    };

});

function createGridConfig(scope, data) {
    for (var i = 0; i < data.length; i++) {
        scope.primaryEntityName = data[0].grd_primaryentitymetadataname;
        scope.singleGridViewId = data[0].grd_singlegridviewId;
        if (data[0].grd_grd_singlegridview_grd_columnnameconfigur.results.length > 0) {
            var column = [];
            for (var coli = 0; coli < data[0].grd_grd_singlegridview_grd_columnnameconfigur.results.length; coli++) {
                //column.colName = data[0].grd_grd_singlegridview_grd_columnnameconfigur.results[coli].grd_colname;
                scope.gridData.cols.push(data[0].grd_grd_singlegridview_grd_columnnameconfigur.results[coli].grd_colname);
                //scope.gridData.cols.push(column);
            }
        }
    }
}

function addValToArray(data, prKey, entityName) {
    for (var i = 0; i < data.length; i++) {
        data[i].primarykey = data[i][prKey];
        data[i].entityname = entityName;
    }
    return data;
}

function addResultsToGrid(data, scope, colDefs, primaryKeyIdName, entityName) {
    var entitydata = [];
    for (var i = 0; i < data.length; i++) {
        for (var colNo = 0; colNo < colDefs.length; colNo++) {
            switch (colDefs[colNo]["grd_attributetype"].Value) {  
                case 172390001: //lookup attribute type
                    entitydata[colDefs[colNo]["grd_columngridid"].Name] = data[i][colDefs[colNo]["grd_attributemetadataname"]].Name;
                    break;
                case 172390002 : //Date time attribute type
                    entitydata[colDefs[colNo]["grd_columngridid"].Name] = crmDateFormat(data[i][colDefs[colNo]["grd_attributemetadataname"]]);
                    break;
                default: //Text and everything else...
                    entitydata[colDefs[colNo]["grd_columngridid"].Name] = data[i][colDefs[colNo]["grd_attributemetadataname"]];
            }
            
        }

        entitydata.entityName = entityName;
        entitydata.primaryKey = data[i][primaryKeyIdName];
        
        scope.gridData.rows.push(entitydata);
        entitydata = [];
    }
}

function crmDateFormat(value) {
    if (value != null) {
        value = value.replace('/Date(', '');
        value = value.replace(')/', '');
        return new Date(parseInt(value));
    }
}
