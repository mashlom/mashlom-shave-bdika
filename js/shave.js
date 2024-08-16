var app = angular.module("app", ['ngSanitize']);

app.controller("ShaveController", ['$scope', '$rootScope', '$timeout', '$http', '$sce', '$compile', function ($scope, $rootScope, $timeout, $http, $sce, $compile) {
    const ctrl = this;
    window.ctrl = this;
    ctrl.termsAccepted = false;
    ctrl.recommendations = {} 
    ctrl.age_sex_to_data_mapping = {};
    ctrl.medical_advice_dict = {};
    ctrl.well_being_pairs_dict = {};
    ctrl.age = getParameterByName("age");
    ctrl.sex = getParameterByName("sex");
    ctrl.isWelcomePage = true;
    ctrl.medicalCaseIds = "";
    ctrl.wellbeingCaseIds = "";    
    ctrl.height = "";
    ctrl.weight = "";
    ctrl.bmi_results = {};

    function init() {
        $http.get('data/age_sex_to_data_mapping.json').then(function (response) {
            ctrl.age_sex_to_data_mapping = response.data;
        });
        $http.get('data/medical_advice_recommendations.json').then(function (response) {
            ctrl.medical_advice_dict =  Object.fromEntries(response.data.map(item => [item.id, item]));
        });
        $http.get('data/well_being_recommendations.json').then(function (response) {
            ctrl.well_being_pairs_dict =  Object.fromEntries(response.data.map(item => [item.id, item]));
        });
        $http.get('data/bmi_results.json').then(function (response) {
            ctrl.bmi_results = response.data;
        });
    };

    init();

    ctrl.trustedHtml = function(html) {
        return $sce.trustAsHtml(html);
    };

    // Function to compile HTML to activate directives
    ctrl.compileHtml = function(element) {
        var el = angular.element(element);
        $compile(el.contents())($scope);
    };
    
    ctrl.calcBMI = function(){
        var heightInMeters = ctrl.height / 100;

        // Calculate BMI using the formula: weight (kg) / (height (m) ^ 2)
        var bmi = ctrl.weight / (heightInMeters * heightInMeters);
    
        // Return the calculated BMI
        return bmi.toFixed(1);
    }

    ctrl.getBmiRangeKey = function() {
        const bmi = ctrl.calcBMI();
        if (bmi < 18.5) {
            return 'underweight';
        } else if (bmi >= 18.5 && bmi < 25) {
            return 'normal';
        } else if (bmi >= 25 && bmi < 30) { // Updated comparison for correct logic
            return 'overweight';
        } else {
            return 'obesity';
        }
    };

    ctrl.getBMIText = function(){
        return ctrl.bmi_results[ctrl.getBmiRangeKey()]?.text;
    }

    ctrl.inputSatisifed = function() {
        return !!ctrl.sex && !!ctrl.age;
    };

    ctrl.markAsAcceptedTerms = function() {
        if (ctrl.termsAccepted) {
            const currentTimestamp = Date.now();
            localStorage.setItem('lastAccepetedTerms', currentTimestamp.toString());
        }
    };

    ctrl.calculateRecommendations = function() {
        if (!ctrl.inputSatisifed()) {
            return;
        }
        ctrl.markAsAcceptedTerms();
        ctrl.isWelcomePage = false;
        updateQueryParameter("age", ctrl.age);
        updateQueryParameter("sex", ctrl.sex);
        const key = `${ctrl.age},${ctrl.sex=='male' ? 'True': 'False'}`;
        ctrl.medicalCaseIds = ctrl.age_sex_to_data_mapping[key]?.medical_case;        
        ctrl.wellbeingCaseIds = ctrl.age_sex_to_data_mapping[key]?.wellbeing_case;        
    };

    ctrl.personalizedMedicalRecommendations = function() {
        return ctrl.medicalCaseIds.map(key => ctrl.medical_advice_dict[key]);
    }

    ctrl.personalizedWellbeingRecommendations = function() {
        return ctrl.wellbeingCaseIds.map(key => ctrl.well_being_pairs_dict[key]);
    }

}]);

app.directive('bmi', function () {
    return {
        restrict: 'E',
        templateUrl: 'htmls/bmi.html',
        link: function (scope, element, attrs) {
        }
    };
});


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