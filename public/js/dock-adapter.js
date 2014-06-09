
var dockingAdapter = (function(){

    var me = {},
        fin = {};

    me.managedState = {
        dockingTarget : false,
        canDock : false,
        currentlyDocking : false,
        isDocked : false

    };



    me.init = function(config ){

        var draggableArea = document.querySelector('.container'),
            dock = document.querySelector('.dock'),
            undock = document.querySelector('.undock'),
            mainWindow = config.mainWindow;
        fin = config.fin;

        me.windowCallbacks = {
            onDockCandidate : config.onDockCandidate,
            onNoDockCandidate : config.onNoDockCandidate,
            onDocked : config.onDocked,
            onUnDocked : config.onUnDocked
        };

        me.managedState.mainWindow = mainWindow;

        subscribeToDocking();
        registerBoundsChanging();
        subscribeToDockEligible(dock);
        subscribeToDockNoCandidate(dock);

        //set the drag animations.
        me.managedState.mainWindow.defineDraggableArea(draggableArea, function(data) {
            me.managedState.mainWindow.animate({
                opacity: 0.7,
            }, {
                interrupt: false
            });
        }, function(data) {
            me.managedState.mainWindow.animate({
                opacity: 1
            }, {
                interrupt: false
            });
            mouseUpOnDraggable(fin, dock, undock);
        }, function(err) {
            console.log(err);
        });

    };//end init


    // this needs to be called by the user window
    me.undock = function(){
        undockWindow();
    };


    function mouseUpOnDraggable(){

        if (me.managedState.canDock && !me.managedState.isDocked){

            me.managedState.currentlyDocking = true;

            me.managedState.mainWindow.animate({
                opacity: 0.7,
                position: {
                    top: me.managedState.dockingTarget.bounds.top,
                    left: me.managedState.dockingTarget.bounds.left + me.managedState.dockingTarget.bounds.width,
                    duration: 500
                }
            }, {
                interrupt: true
            },
            function() {

                me.managedState.mainWindow.getBounds(function(bounds){

                    doDock(bounds);

                },
                function(err){
                    console.warn('the err of the bounds ',err);
                });

            });//end animate

        }//end if docking target
    }//end mouseUpOnDraggable


    function doDock(bounds){

        var topGood = (bounds.top === me.managedState.dockingTarget.bounds.top),
        leftGood = (bounds.left === me.managedState.dockingTarget.bounds.left + me.managedState.dockingTarget.bounds.width);

        if (topGood && leftGood) {

            var dockingWindow = fin.desktop.Window.wrap(
                me.managedState.dockingTarget.dockee.app_uuid,me.managedState.dockingTarget.dockee.name);

            me.managedState.mainWindow.joinGroup(dockingWindow, function(){

                setPostDockingState (fin);

                console.warn('it grouped just fine');
            },
            function(reason){
                console.warn('it did not group', reason);
            });

        }//end if top left good
        else {
            console.warn('im not where I thought Id be ', bounds , me.managedState.dockingTarget.bounds);
        }

    }


    function setPostDockingState () {

        me.windowCallbacks.onDocked();

        fin.desktop.InterApplicationBus.publish( "dock-docked", {
            target : me.managedState.dockingTarget.dockee.name,
            name : me.managedState.mainWindow.name
        });

        me.managedState.currentlyDocking = false;
        me.managedState.isDocked = true;
        me.managedState.canDock = false;
    }


    function undockWindow(){
        me.managedState.mainWindow.leaveGroup(function(){

            fin.desktop.InterApplicationBus.publish( "dock-undocked", {
                target : me.managedState.dockingTarget.dockee.name,
                name : me.managedState.mainWindow.name
            });

            me.managedState.isDocked = false;
            me.managedState.canDock = true;

            me.windowCallbacks.onUnDocked();

        },function(err){
            console.warn(err);
        });

    }


    function subscribeToDockNoCandidate(dock) {
        fin.desktop.InterApplicationBus.subscribe("snap-map", "dock-no-candidate:"+me.managedState.mainWindow.name, function (data) {

            if (!me.managedState.currentlyDocking  && !me.managedState.isDocked) {

                me.windowCallbacks.onNoDockCandidate();

                me.managedState.canDock = false;
                console.warn('all alone... cant dock', data);
            }
        });//end subscribe

    }


    function subscribeToDockEligible(dock){

        fin.desktop.InterApplicationBus.subscribe("snap-map", "dock:"+me.managedState.mainWindow.name, function (data) {

            if (!me.managedState.currentlyDocking && !me.managedState.isDocked) {

                me.windowCallbacks.onDockCandidate();

                me.managedState.dockingTarget = data;
                me.managedState.canDock = true;
                console.log('Ive been told to dock!', data);
            }
        });//end subscribe

    }


    function subscribeToDocking(){

        me.managedState.mainWindow.getBounds(function(bounds){

            fin.desktop.InterApplicationBus.publish( "dock-subscribe", {
                name : me.managedState.mainWindow.name,
                app_uuid : me.managedState.mainWindow.app_uuid,
                location:  bounds
            });
        },
        function(err){
            console.log('the err', err);
        });

    }//end subscribeToDocking


    function registerBoundsChanging() {

        me.managedState.mainWindow.addEventListener('bounds-changing', function(data) {
            console.log('on the move ', data);

            me.managedState.mainWindow.getBounds(function(bounds){

                fin.desktop.InterApplicationBus.publish( "dock-window-move", {
                    bounds : bounds,
                    name : me.managedState.mainWindow.name
                });
            },
            function(err){
                console.log('the err', err);
            });
        }); //end bounds changing

    }//end registerBoundsChanging

    return me;

})();

// quick-n-dirty window to test with
// WindowFactory.create({name:"asdfasdfa"+Math.random(),url:"views/cpu.html",autoShow:true, "resizable": true,});

