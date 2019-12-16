var app = {

    api: 'http://localhost:51205/',

    $app : null,
    products: [],

    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        $(function(){

            app.$app = $('#app');

            app.loading(true);

            $('#logout').click(function(){
                app.logout();
                app.goLogin();
            });

            $('#history').click(function(){
                app.goHistory();
            });

            $.get('./products.json', function(data){

                app.products = data;

                if(app.isLoggedIn()){
                    app.goMain();
                } else {
                    app.goLogin();
                }

            });

        });
        
    },


    isLoggedIn: function(){
        return !!window.localStorage.getItem('token');
    },

    login: function(token){
        window.localStorage.setItem('token', token);
    },

    logout: function(){
        window.localStorage.removeItem('token');
    },


    loading: function(show){
        if(show){
            $('#loading').show();
            app.$app.hide();
        } 
        else{
            $('#loading').hide();
            app.$app.show();
        } 
    },


    goLogin: function(){
        app.go('login', function(){

            let $form = $("#loginform");
            $form.submit(function(event){
                event.preventDefault();
                
                app.post({
                    api: 'users/authenticate',
                    setToken: false,
                    data: {
                        username: $('[name="username"]', $form).val(),
                        password: $('[name="password"]', $form).val()
                    },
                    success: function(data){
                        app.login(data.token);
                        app.goMain();
                    },
                    error: function(jqXHR, status, errorStr){
                        alert(status.toString() + errorStr);
                    }
                });

            });

        });
    },

    goActive: function(order){
        app.go('active', function(){
                
            $('#id').text(order.orderId);

            for (let index = 0; index < order.order_Products.length; index++) {
                const element = order.order_Products[index];
                $('#prodlist').append('<li class="list-group-item d-flex justify-content-between align-items-center">' + element.description + '<span class="badge badge-primary badge-pill">' + element.count + '</span></li>');
            }

            $('#budget').text(order.budget);
            $('#tip').text(order.tip);
            $('#address').text(order.address);
            $('#memo').text(order.memo);
            $('#status').text(order.status == 0 ? 'Ожидание принятия' : (order.status == 1 ? 'Выполняется' : (order.status == 2 ? 'Доставлен' : (order.status == 3 ? 'Отменён' : 'Завершён'))));

            if(order.status != 2) $('#confirmbutton').hide();
            if(order.status > 0) $('#cancelbutton').hide();

            $('#cancelbutton').click(function(){
 
                app.post({
                    api: 'orders/cancel/' + order.orderId,
                    success: function(){
                        app.goMain();
                    },
                    error: function(jqXHR, status, errorStr){
                        alert(status.toString() + errorStr); 
                    }
                });
            });

            $('#confirmbutton').click(function(){
                app.goOrderConfirm(order);
            });

        });
    },

    goMain: function(){
        app.get({
            api: 'orders/getActive',
            success: function(data){

                if(data){
                    app.goActive(data);
                } else if(app.getProdCount()) {
                    app.goCreate();
                } else {
                    app.go('welcome', function(){

                        $('#createbutton').click(function(){
                            app.goCreate();
                        });
            
                        $('#workbutton').click(function(){
                            app.goWork();
                        });
                    
                    });
                }
            },
            error: function(jqXHR, status, errorStr){
                alert(status.toString() + errorStr);
                app.$app.empty();
                app.$app.append('<p class="text-danger">Произошла ошибка.</p><button class="btn btn-primary" id="retry">Повторить попытку</button>');
                $('#retry').click(function(){app.goMain();});
            }
        });
    },

    goCreate: function(){
        app.go('create', function(){

            $('#continue').click(function(){
                app.goOrder();
            });

            $('#cancel').click(function(){
                app.clearProd();
                app.goMain();
            });

            function _updatePC(){
                let prodslen = app.getProdCount();
                if(!prodslen){
                    $('#prodyes').hide();
                    $('#continue').hide();
                    $('#cancel').hide();
                } else {
                    $('#prodyes').show();
                    $('#continue').show();
                    $('#cancel').show();
                    $('#prodno').hide();
                    $('#cant').text(prodslen);
                }               
            }
            _updatePC();

            let $cats = $('#prodcat');
            for (let index = 0; index < app.products.length; index++) {
                const element = app.products[index];
                let $ren = $('<div class="btn btn-light text-center col-4"><a href="#"><img src="./img/category/' + element.id + '.png"><br>' + element.desc + '</a></div>');
                
                $('a', $ren).click(function(){
                    $cats.empty();

                    $('#modaladd').click(function(){ 
                        $('#addProdModal').data('result', true); 
                    });

                    $ren = $('<div class="btn btn-secondary col-12 mb-2"><a href="#" class="text-light"><< Вернутся</a></div>');
                    
                    $('a', $ren).click(function(){
                        app.goCreate();
                    });

                    $cats.append($ren);

                    for (let i2 = 0; i2 < element.prods.length; i2++) {
                        const element2 = element.prods[i2];
                        $ren = $('<div class="btn btn-light col-12"><a href="#">' + element2.desc + '</a></div>');
                        $('a', $ren).click(function(){
                            $('#addProdModal').data('result', false);
                            $('#modalprod').val(element2.desc);
                            $('#modalcount').val(1);
                            $('#addProdModal').modal();
                            $('#addProdModal').data('result', false);
                            $('#addProdModal').one('hidden.bs.modal', function (e) {
                                if($('#addProdModal').data('result')) {
                                    app.addProd({ productId: element2.id, desc: $('#modalprod').val(), count: parseInt($('#modalcount').val())});
                                    _updatePC();
                                }
                              });
                        });
                        $cats.append($ren);
                    }
                });
                $cats.append($ren);
            }
        });
    },

    goOrder: function(){
        app.go('order', function(){

            let sprods = window.localStorage.getItem('prods') && JSON.parse(window.localStorage.getItem('prods')) || [];

            if(!sprods.length) {
                app.goMain();
                return;
            }

            for (let index = 0; index < sprods.length; index++) {
                const element = sprods[index];
                $('#prodlist').append('<li class="list-group-item d-flex justify-content-between align-items-center">' + element.desc + '<span class="badge badge-primary badge-pill">' + element.count + '</span></li>');
            }

            $('#continue').click(function(){
                
                let data = {
                    products: [],
                    budget: parseInt($('#budget').val()),
                    tip: parseInt($('#tip').val()),
                    address: $('#address').val(),
                    memo: $('#memo').val()
                };

                for (let index = 0; index < sprods.length; index++) {
                    const element = sprods[index];
                    data.products.push({
                        description: element.desc,
                        productId: element.productId,
                        count: parseInt(element.count),
                        unit: 0,
                        budget: 0
                    });
                }

                app.post({
                    api: 'orders/create',
                    data: data,
                    success: function(){
                        app.clearProd();
                        app.goMain();
                    },
                    error: function(jqXHR, status, errorStr){
                        alert(status.toString() + errorStr);
                    }
                });
            });
            $('#return').click(function(){
                app.goMain();
            });
            $('#cancel').click(function(){
                app.clearProd();
                app.goMain();
            });
        });
    },

    goOrderConfirm: function(order){
        app.go('orderconfirm', function(){

            $('#id').text(order.orderId);

            for (let index = 0; index < order.order_Products.length; index++) {
                const element = order.order_Products[index];
                $('#prodlist').append('<li class="list-group-item d-flex justify-content-between align-items-center">' + element.description + '<span class="badge badge-primary badge-pill">' + element.count + '</span></li>');
            }

            $('#budget').text(order.budget);
            $('#tip').text(order.tip);
            $('#address').text(order.address);
            $('#memo').text(order.memo);
            $('#status').text(order.status == 0 ? 'Ожидание доставщика' : (order.status == 1 ? 'Выполняется' : (order.status == 2 ? 'Доставлен' : (order.status == 3 ? 'Отменён' : 'Завершён'))));
            
            $('#confirm').click(function(){
                app.post({
                    api: 'orders/confirm/' + order.orderId.toString(),
                    data: {
                            memo: $('#memo2').val()
                        },
                    success: function(){
                        app.goMain();
                    },
                    error: function(jqXHR, status, errorStr){
                        alert(status.toString() + errorStr);
                    }
                });
            });

            $('#return').click(function(){
                app.goMain();
            });

        });
    },

    goWork: function(){
        app.get({
            api: 'orders/getAcceptable',
            success: function(data){

                app.go('work', function(){

                    if(data.length) {
                        
                        $('#empty').hide();

                        for (let index = 0; index < data.length; index++) {
                            const element = data[index];
                            let $ren = $('<a href="#" class="list-group-item list-group-item-action flex-column align-items-start"><div class="d-flex w-100 justify-content-between"><h5 class="mb-1">' + element.address + '</h5><small>' + element.order_Products.length.toString() + ' продуктов</small></div><p class="mb-1">Оплата: ' + element.tip.toString() + ' Бюджет: ' + element.budget.toString() + '</p><small>' + element.memo + '</small></a>');
                            $ren.click(function(){
                                app.goWorkOrder(element);
                            });
                            $('#orders').append($ren);
                        }

                    }

                    $('#return').click(function(){
                        app.goMain();
                    });
                    
                });

            },
            error: function(jqXHR, status, errorStr){
                alert(status.toString() + errorStr);
            }
        });
    },

    goWorkOrder: function(order){
        app.go('workorder', function(){

            for (let index = 0; index < order.order_Products.length; index++) {
                const element = order.order_Products[index];
                $('#prodlist').append('<li class="list-group-item d-flex justify-content-between align-items-center">' + element.description + '<span class="badge badge-primary badge-pill">' + element.count + '</span></li>');
            }
            $('#id').text(order.orderId);
            $('#budget').text(order.budget);
            $('#tip').text(order.tip);
            $('#address').text(order.address);
            $('#memo').text(order.memo);

            $('#return').click(function(){
                app.goWork();
            });

            $('#accept').click(function(){
                app.goWorkAccept(order);
            });
        });
    },

    goWorkAccept: function(order){
        app.post({
            api: 'orders/accept/' + order.orderId.toString(),
            success: function(){

                app.go('workaccept', function(){

                    for (let index = 0; index < order.order_Products.length; index++) {
                        const element = order.order_Products[index];
                        $('#prodlist').append('<li class="list-group-item d-flex justify-content-between align-items-center">' + element.description + '<span class="badge badge-primary badge-pill">' + element.count + '</span></li>');
                    }
                    $('#id').text(order.orderId);
                    $('#budget').text(order.budget);
                    $('#tip').text(order.tip);
                    $('#address').text(order.address);
                    $('#memo').text(order.memo);

                    $('#cancel').click(function(){
                        app.post({
                            api: 'orders/cancel/' + order.orderId.toString(),
                            success: function(){
                                app.goWork();
                            },
                            error: function(jqXHR, status, errorStr){
                                alert(status.toString() + errorStr);
                            }
                        });
                    });

                    $('#finish').click(function(){
                        app.goWorkFinish(order);
                    });
                });
            },
            error: function(jqXHR, status, errorStr){
                alert(status.toString() + errorStr);
            }
        });
    },

    goWorkFinish: function(order){

        app.go('workfinish', function(){

            for (let index = 0; index < order.order_Products.length; index++) {
                const element = order.order_Products[index];
                $('#prodlist').append('<li class="list-group-item d-flex justify-content-between align-items-center">' + element.description + '<span class="badge badge-primary badge-pill">' + element.count + '</span></li>');
            }
            $('#id').text(order.orderId);
            $('#budget').text(order.budget);
            $('#tip').text(order.tip);
            $('#address').text(order.address);
            $('#memo').text(order.memo);

            $('#return').click(function(){
                app.goWorkAccept(order);
            });

            $('#finish').click(function(){
                app.post({
                    api: 'orders/finish/' + order.orderId.toString(),
                    data: {
                        memo: $('#memo2').val()
                    },
                    success: function(){
                        app.goWork();
                    },
                    error: function(jqXHR, status, errorStr){
                        alert(status.toString() + errorStr);
                    }
                });
            });
        });
    },


    addProd: function(prod){
        let sprods = window.localStorage.getItem('prods') && JSON.parse(window.localStorage.getItem('prods')) || [];
        sprods.push(prod);
        window.localStorage.setItem('prods', JSON.stringify(sprods));
    },

    getProdCount: function(){
        let sprods = window.localStorage.getItem('prods') && JSON.parse(window.localStorage.getItem('prods')) || [];
        return sprods.length;
    },

    clearProd: function(){
        window.localStorage.removeItem('prods');
    },


    setToken: function(xhr){
        xhr.setRequestHeader('Authorization', 'Bearer ' + window.localStorage.getItem('token'));
    },

    go: function(file, ready){
        app.$app.empty();
        app.loading(true);
        $.get('./' + file + '.html', function(data){
            app.$app.append(data);
            app.loading(false);
            ready();
        });
    },

    post: function(options){
        app.loading(true);
        $.ajax({
            url: app.api + options.api,
            method: 'POST',
            beforeSend: typeof options.setToken === 'undefined' || options.setToken === true ? app.setToken : undefined,
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify(options.data),
            success: function(data){
                app.loading(false);
                options.success(data);
            },
            error: function(jqXHR, status, errorStr){
                app.loading(false);
                if(status === 401){
                    app.logout();
                    app.goLogin();
                } else {
                    if(options.error) options.error(jqXHR, status, errorStr);
                }
            }
        });
    },

    get: function(options){
        app.loading(true);
        $.ajax({
            url: app.api + options.api,
            method: 'GET',
            beforeSend: typeof options.setToken === 'undefined' || options.setToken === true ? app.setToken : undefined,
            contentType: 'application/json;charset=utf-8',
            success: function(data){
                app.loading(false);
                options.success(data);
            },
            error: function(jqXHR, status, errorStr){
                app.loading(false);
                if(status === 401){
                    app.logout();
                    app.goLogin();
                } else {
                    if(options.error) options.error(jqXHR, status, errorStr);
                }
            }
        });
    }

};

app.initialize();