var app = angular.module("app", []);

app.controller("ResusController", ['$scope', '$rootScope', '$timeout', '$http', function ($scope, $rootScope, $timeout, $http) {
    const ctrl = this;
    window.ctrl = this;
    ctrl.tal = "taltest";
    ctrl.recommendations = {} 
    ctrl.age = "";
    ctrl.sex = "M";

    function init() {
        $http.get('/data/recommendations.json').then(function (response) {
            ctrl.recommendations = response.data;
        });
    };

    init();

    ctrl.init = function () {
        init();
    }
}]);


app.directive('selectOnClick', ['$window', function ($window) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModelCtrl) {
            var prevValue = '';
            element.on('click', function () {
                if (!$window.getSelection().toString()) {
                    this.setSelectionRange(0, this.value.length);
                }
            });
            element.on('input', function () {
                if (this.checkValidity()) {
                    prevValue = this.value;
                } else {
                    this.value = prevValue;
                    ngModelCtrl.$setViewValue(this.value);
                    ngModelCtrl.$render();
                }
            });
        }
    };
}]);