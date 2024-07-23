var app = angular.module("app", []);

app.controller("ResusController", ['$scope', '$rootScope', '$timeout', '$http', function ($scope, $rootScope, $timeout, $http) {
    const ctrl = this;
    window.ctrl = this;
    ctrl.dataShown = 'CALCULATOR'; // possible values: CALCULATOR, WEIGHTS, LMA
    ctrl.weight;
    ctrl.age;
    ctrl.ageScale = 'YEARS';
    ctrl.sex; // possible values: MALE, FEMALE
    ctrl.drugsData = {};
    ctrl.drugDefinitonsForUI = [];
    ctrl.agesFroDropDown = [];
    ctrl.airwaysData = {};
    ctrl.dripsDefinitions = {};
    ctrl.dripsInstructions = {};
    ctrl.airwaysForAge = {};
    ctrl.estimatedWeighByAge = {};
    ctrl.esitmatedMaleWeight = "";
    ctrl.esitmatedFemaleWeight = "";
    ctrl.tooltipIndex = "";

    function init() {
        $http.get('/resus/data/resus-drugs-definitions.json').then(function (response) {
            ctrl.drugsData = response.data;
            ctrl.drugDefinitonsForUI = ctrl.createDrugDefinitonsForUI(response.data)
        });
        $http.get('/resus/data/airways.json').then(function (response) {
            ctrl.airwaysData = response.data;
            parseRawDataToEstimatedWeights();
            createDropDownData();
        });
        $http.get('/resus/data/drips.json').then(function (response) {
            ctrl.dripsDefinitions = response.data.drugs;
        });

    };

    ctrl.createDrugDefinitonsForUI = function (data) {
        return data.sections.flatMap(category => {
            return category.drugs.map(drug => {
                return {
                    "drug_name": drug.name,
                    "dosage": `${drug.dose_per_kg} ${drug.dose_unit}`,
                    "medical_concentration": drug.concentration ? `${drug.concentration} ${drug.dose_unit}/ml` : "",
                    "max_dose": drug.maxDose ? `${drug.maxDose} ${drug.maxDoseUnit}` : ""
                };
            });
        });
    };

    ctrl.dripInstructions = function (drugName) {
        return ctrl.dripsInstructions[drugName];
    }

    ctrl.dripDefinition = function (drugName) {
        return ctrl.dripsDefinitions[drugName];
    }

    ctrl.formatNumber = function (num) {
        // Use toFixed(2) to get a string with two decimal places
        let formatted = num.toFixed(2);

        // Use a regular expression to remove trailing zeros
        formatted = formatted.replace(/\.?0+$/, '');

        return formatted;
    }

    function createDropDownData() {
        const ages = ctrl.airwaysData.dataByAge.map(item => item.age);
        ages.forEach(age => {
            ctrl.agesFroDropDown.push({ label: ctrl.formatAge(age), value: age });
        });
    }

    function parseRawDataToEstimatedWeights() {
        for (var i = 0; i < ctrl.airwaysData.dataByAge.length; ++i) {
            const { age, estimatedMaleWeight, estimatedFemaleWeight } = ctrl.airwaysData.dataByAge[i];
            ctrl.estimatedWeighByAge[age] = { male: estimatedMaleWeight, female: estimatedFemaleWeight };
        }
    }

    ctrl.applyMale = function () {
        ctrl.weight = ctrl.esitmatedMaleWeight;
    };

    ctrl.applyMaleRounded = function () {
        ctrl.weight = Math.ceil(ctrl.esitmatedMaleWeight);
    };

    ctrl.applyFemaleRounded = function () {
        ctrl.weight = Math.ceil(ctrl.esitmatedFemaleWeight);
    };

    ctrl.applyFemale = function () {
        ctrl.weight = ctrl.esitmatedFemaleWeight;
    };

    ctrl.getDefi = function (multiplier) {
        return Math.min(multiplier * ctrl.weight, 200);
    };

    ctrl.toggleTooltip = function (index) {
        if (ctrl.tooltipIndex === index) {
            ctrl.tooltipIndex = null;
        } else {
            ctrl.tooltipIndex = index;
        }
    };

    ctrl.replaceSpacesWithUnderline = function (str) {
        return str.replace(/ /g, "_");
    }

    ctrl.ageAsInTable = function () {
        if (ctrl.age == 1 && ctrl.ageScale == 'YEARS') {
            return "12 month";
        }
        if (ctrl.age == 2 && ctrl.ageScale == 'YEARS') {
            return "24 month";
        }
        return ctrl.age + (ctrl.ageScale == 'YEARS' ? " year" : " month");
    }

    ctrl.shouldWarnOnWeight = function () {
        if (!!ctrl.age && !!ctrl.weight && !!ctrl.esitmatedFemaleWeight) {
            return ctrl.weight > 2.5 * ctrl.esitmatedFemaleWeight;
        }
        return false;
    }

    ctrl.changedValue = function () {
        if (!ctrl.age) {
            ctrl.esitmatedMaleWeight = "";
            ctrl.esitmatedFemaleWeight = "";
            return;
        }
        ctrl.esitmatedMaleWeight = ctrl.estimatedWeighByAge[ctrl.age].male;
        ctrl.esitmatedFemaleWeight = ctrl.estimatedWeighByAge[ctrl.age].female;

        for (var i = 0; i < ctrl.airwaysData.dataByAge.length; ++i) {
            const currData = ctrl.airwaysData.dataByAge[i];
            if (ctrl.age == currData.age) {
                ctrl.airwaysForAge = currData;
                return;
            }
        }
    };

    ctrl.getDoseByTimeUnit = function (drip) {
        return drip.dose_per_kg_per_min ?? drip.dose_per_kg_per_hour;
    };

    ctrl.calcDilutionPerKg = function (drip) {
        return calcDilutionPerKg(drip, ctrl.weight);
    };

    ctrl.calcInfusionSpeed = function (drip) {
        return ctrl.formatNumber(calcInfusionSpeed(drip, ctrl.weight));
    };

    ctrl.closeTooltip = function () {
        ctrl.tooltipIndex = "";
    }

    ctrl.getDoseByWeightWithMaxLimit = function (drugDefintion) {
        let doseByWeight = drugDefintion.dose_per_kg * ctrl.weight;
        if (drugDefintion.maxDose) {
            doseByWeight = Math.min(drugDefintion.maxDose, doseByWeight);
        }
        return doseByWeight;
    }

    ctrl.getDripDosePerHourPerWeight = function (drugData) {
        return ctrl.formatNumber(calcDosePerHourPerWeight(drugData, ctrl.weight));
    }

    ctrl.calcInfusionSpeed = function (drugData) {
        const dosePerKg = calcDosePerHourPerWeight(drugData, ctrl.weight);
        if (drugData.dose_unit !== drugData.existing_dilution_concentration_dose_unit) {
            throw new Error("Dosage unit and existing concentration does not match. need to implement units aligmnet before calculation. drug with error:" + drugData.name);
        }
        const [numerator, denominator] = ctrl.splitRatio(drugData.existing_dilution_concentration);
        const concentration = numerator / denominator;
        return dosePerKg / concentration;  // Volume = Mass / Concentration
    }

    ctrl.splitRatio = function (ratio) {
        return ratio.split('/').map(Number);
    };

    ctrl.getAdministrationUnit = function (drugDefintion) {
        if (drugDefintion.type == 'mass') {
            return drugDefintion.dose_unit;
        }
        else {
            return 'ml';
        }
    }

    ctrl.calcAmountToAdminister = function (drugDefintion) {
        let amount;
        if (drugDefintion.type == 'fluid' || drugDefintion.type == 'mass') {
            amount = ctrl.getDoseByWeightWithMaxLimit(drugDefintion);
        } else {
            amount = ctrl.calcVolume(drugDefintion);
        }

        return ctrl.formatNumber(amount);
    }

    ctrl.calcVolume = function (drugDefintion) {
        const doseByWeight = ctrl.getDoseByWeightWithMaxLimit(drugDefintion);
        const [numerator, denominator] = ctrl.splitRatio(drugDefintion.concentration);
        const concentration = numerator / denominator;

        return doseByWeight / concentration;
    };

    ctrl.selectSex = function (sex) {
        ctrl.sex = sex;
        if (!ctrl.airwaysForAge || !ctrl.sex) {
            return;
        }
        const key = ctrl.sex == 'MALE' ? 'estimatedMaleWeight' : 'estimatedFemaleWeight';
        ctrl.weight = ctrl.airwaysForAge[key];
    };

    ctrl.allValuesSatisfied = function () {
        return ctrl.weight && ctrl.age;
    };

    ctrl.getBlade = function () {
        return ctrl.airwaysForAge.blade;
    };
    ctrl.getEttDiameter = function () {
        return ctrl.airwaysForAge.cuffedETT;
    };
    ctrl.getLma = function () {
        return ctrl.airwaysForAge.lma;
    };

    ctrl.resetAll = function () {
        ctrl.weight = undefined;
        ctrl.age = undefined;
        ctrl.esitmatedMaleWeight = "";
        ctrl.esitmatedFemaleWeight = "";
    };

    ctrl.openPanel = function (panel) {
        ctrl.dataShown = panel;
    };

    ctrl.closePanel = function () {
        ctrl.dataShown = 'CALCULATOR';
    };

    ctrl.formatAge = function (age) {
        if (age == "0 month") {
            return "בן יומו";
        }
        if (age == "1 month") {
            return "חודש";
        }
        if (age == "2 month") {
            return "חודשיים";
        }
        if (age == "1 year") {
            return "שנה";
        }
        if (age == "2 year") {
            return "שנתיים";
        }
        return age.replace("month", "חודשים").replace("year", "שנים");
    }

    init();
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

app.directive('weights', function () {
    return {
        restrict: 'E',
        templateUrl: 'htmls/weights.html',
        link: function (scope, element, attrs) {
        }
    };
});

app.directive('lma', function () {
    return {
        restrict: 'E',
        templateUrl: 'htmls/lma.html',
        link: function (scope, element, attrs) {
        }
    };
});

app.directive('definitions', function () {
    return {
        restrict: 'E',
        templateUrl: 'htmls/drugsDefinitions.html',
        link: function (scope, element, attrs) {
        }
    };
});


app.directive('drugs', function () {
    return {
        restrict: 'E',
        templateUrl: 'htmls/drugs.html',
        link: function (scope, element, attrs) {
        }
    };
});

app.directive('drips', function () {
    return {
        restrict: 'E',
        templateUrl: 'htmls/drips.html',
        link: function (scope, element, attrs) {
        }
    };
});