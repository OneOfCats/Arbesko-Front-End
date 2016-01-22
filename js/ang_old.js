var app = angular.module('application', []);

app.controller('appController', ['$scope', 'dataInOut', function($scope, dataInOut){
  //Attaching the data-object in scope to the data-object in dataInOut service
  $scope.allData = dataInOut.dataObject;
  //Get http promice object
  var httpGetLocales = dataInOut.getLocales();
  var httpGetTranslations;
  //Create the languages array and set the default language when http request is completed
  httpGetLocales.then(function(data){
    //A list of languages
    $scope.allLanguages = new Array();
    for(var i = 0; i < $scope.allData.length; i++){
      $scope.allLanguages.push($scope.allData[i].language);
    }
    //Current language and it's index
    $scope.currentLang = {string: $scope.allData[0]['language'], number: 0};
  }).finally(function(){
    httpGetTranslations = dataInOut.getTranslations();
  });
  //Object for searching filter: searching string, searching field
  $scope.search = {str: '', by: ''};
  //Order by
  $scope.orderByString = 'name';

  $scope.changeOrder = function(string){
    if($scope.orderByString[0] == '-'){
      $scope.orderByString = string;
    }else if($scope.orderByString == string){
      $scope.orderByString = '-' + string;
    }else{
      $scope.orderByString = string;
    }
  };

  $scope.changeLanguage = function($index){
    $scope.currentLang.string = $scope.allLanguages[$index];
    $scope.currentLang.number = $index;
  };

  $scope.deleteLine = function($index){
    for(var i = 0; i < $scope.allData.length; i++){
      $scope.allData[i].fileContent.splice($index, 1);
    }
  };

  $scope.addLine = function(){
    for(var i = 0; i < $scope.allData.length; i++){
      $scope.allData[i].fileContent.push({msgid: $scope.newLineName, msgstr: ''});
    }
    $scope.newLineName = '';
  };

  $scope.saveRequest = function(){
    dataInOut.sendTranslations();
  };
}]);

//Searches for lines that match the data from the search object
app.filter('customSearch', function(){
  return function(objects, search){
    if(search.str.length == 0 || search.by.length == 0) return objects; //if none of radio buttons are checked, do nothing
    var filtered = [];
    for(var i = 0; i < objects.length; i++){
      if(objects[i][search.by].indexOf(search.str) != -1){
        filtered.push(objects[i]);
      }
    }
    return filtered;
  };
});

app.factory('dataInOut', ['$http', function(http){
  var self = this;
  self.dataObject = [];

  self.getLocales = function getLocales(){
    var httpData;
    return http({method: 'GET', url: 'http://translations.arbesko.com/locales/'})
        .then(initDataObject);
    function initDataObject(response){
      httpData = response.data['locales'];
      for(var i = 0; i < httpData.length; i++){
        self.dataObject.push({fileName: httpData[i], language: httpData[i]});
        self.dataObject[self.dataObject.length - 1].fileContent = new Array();
      }
      response = self.dataObject;
      return response;
    };
  };

  self.getTranslations = function getTranslations(locale){
    if(locale){
      for(var i = 0; i < self.dataObject.length; i++){
        if(self.dataObject[i].fileName == locale){
          return http({method: 'GET', url: 'http://translations.arbesko.com/locales/' + locale})
            .then(function httpSuccess(response){
              self.dataObject[i].fileContent = response.data;
            });
        }
      }
    }else{
      var queries = new Array();
      for(var i = 0; i < self.dataObject.length; i++){
        makeLoopQuery(i);
      }
      return queries;
      function makeLoopQuery(i){ //To make an isolated closure and save the i value for every iteration
        queries.push(http({method: 'GET', url: 'http://translations.arbesko.com/locales/' + self.dataObject[i].fileName})
          .then(function httpSuccess(response){
            self.dataObject[i].fileContent = response.data;
          }));
      }
    }
  };

  self.sendTranslations = function sendTranslations(){
    var queries = new Array();
    for(var i = 0; i < self.dataObject.length; i++){
      makeLoopQuery(i);
    }
    return queries;
    function makeLoopQuery(i){
      queries.push(http.put('http://translations.arbesko.com/locales/' + self.dataObject[i].fileName, self.dataObject[i].fileContent));
    }
  };

  return self;
}]);