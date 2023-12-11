// ViewModel KnockOut
var vm = function () {
    console.log('ViewModel initiated...');
    //---Variáveis locais
    var self = this;
    self.baseUri = ko.observable('https://api.chucknorris.io/jokes');
    self.displayName = 'Chuck Norris jokes';
    self.error = ko.observable('');
    self.passingMessage = ko.observable('');

    //--- Data Record
    self.IconUrl = ko.observable('');
    self.Id = ko.observable('');
    self.Url = ko.observable('');
    self.Value = ko.observable('');
    self.CreatedAt = ko.observable('');
    self.UpdatedAt = ko.observable('');
    self.Categories = ko.observableArray([]);
    self.ListCategories = ko.observableArray([]);
    self.CreatedAtDate = ko.computed(function () {
        var d = new Date(self.CreatedAt());
        return d.toDateString();
    })
    self.UpdatedAtDate = ko.computed(function () {
        var d = new Date(self.UpdatedAt());
        return d.toDateString();
    })
    //--- Page Events
    self.activate = function (id) {
        console.log('CALL: get Random Joke...');
        var composedUri = self.baseUri() + '/random';
        ajaxHelper(composedUri, 'GET').done(function (data) {
            console.log(data);
            hideLoading();
            self.IconUrl(data.icon_url);
            self.Id(data.id);
            self.Url(data.url);
            self.Value(data.value);
            self.CreatedAt(data.created_at);
            self.UpdatedAt(data.updated_at);
            self.Categories(data.categories);
        });
    };
    self.CompleteCategories = function (data, event) {
        let val = event.target.value;
        if (val.length > 1) {
            var composedUri = self.baseUri() + '/categories';
            ajaxHelper(composedUri, 'GET').done(function (data) {
                hideLoading();
                self.ListCategories(data.filter((ctg) => ctg.includes(val)));
            });
        } else {
            self.ListCategories([]);
        }
    };

    //--- Internal functions
    function ajaxHelper(uri, method, data) {
        self.error(''); // Clear error message
        return $.ajax({
            type: method,
            url: uri,
            dataType: 'json',
            contentType: 'application/json',
            data: data ? JSON.stringify(data) : null,
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("AJAX Call[" + uri + "] Fail...");
                hideLoading();
                self.error(errorThrown);
            }
        });
    }

    function showLoading() {
        $('#myModal').modal('show', {
            backdrop: 'static',
            keyboard: false
        });
    }
    function hideLoading() {
        $('#myModal').on('shown.bs.modal', function (e) {
            $("#myModal").modal('hide');
        })
    }

    function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
            }
        }
    };

    //--- start ....
    showLoading();
    var pg = getUrlParameter('id');
    console.log(pg);
    if (pg == undefined)
        self.activate(1);
    else {
        self.activate(pg);
    }
    console.log("VM initialized!");
};

$(document).ready(function () {
    console.log("document.ready!");
    ko.applyBindings(new vm());
});

$(document).ajaxComplete(function (event, xhr, options) {
    $("#myModal").modal('hide');
})