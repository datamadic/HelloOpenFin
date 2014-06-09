
var dockingAdapter = (function(){

    var me = {};
    me.managedState = {
        dockingTarget : false,
        canDock : false,
        currentlyDocking : false,
        isDocked : false

    };
    // DockNoCandidateCallback
    // DockEligibleCallback




    me.init = function(mainWindow, fin ){
        console.warn('initting');

        var draggableArea = document.querySelector('.container'),
            dock = document.querySelector('.dock'),
            undock = document.querySelector('.undock');

        me.managedState.mainWindow = mainWindow;

        subscribeToDocking(fin);
        registerBoundsChanging(fin);
        subscribeToDockEligible(fin, dock);
        subscribeToDockNoCandidate(fin, dock);

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


        undock.addEventListener('click',function(){
            undockWindow(fin, undock);
        });

    };//end init


    function mouseUpOnDraggable(fin, dock, undock){

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

                    doDock(fin, bounds, dock, undock);

                },
                function(err){
                    console.warn('the err of the bounds ',err);
                });

            });//end animate

        }//end if docking target
    }//end mouseUpOnDraggable


    function setPostDockingState (fin, dock, undock) {
        dock.style.display = 'none';
        undock.style.display = 'block';

        fin.desktop.InterApplicationBus.publish( "dock-docked", {
            target : me.managedState.dockingTarget.dockee.name,
            name : me.managedState.mainWindow.name
        });

        me.managedState.currentlyDocking = false;
        me.managedState.isDocked = true;
        me.managedState.canDock = false;
    }


    function doDock(fin, bounds, dock, undock){

        var topGood = (bounds.top === me.managedState.dockingTarget.bounds.top),
        leftGood = (bounds.left === me.managedState.dockingTarget.bounds.left + me.managedState.dockingTarget.bounds.width);

        if (topGood && leftGood) {

            var dockingWindow = fin.desktop.Window.wrap(
                me.managedState.dockingTarget.dockee.app_uuid,me.managedState.dockingTarget.dockee.name);

            me.managedState.mainWindow.joinGroup(dockingWindow, function(){

                setPostDockingState (fin, dock, undock);

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


    function undockWindow(fin, undock){
        me.managedState.mainWindow.leaveGroup(function(){

            fin.desktop.InterApplicationBus.publish( "dock-undocked", {
                target : me.managedState.dockingTarget.dockee.name,
                name : me.managedState.mainWindow.name
            });

            me.managedState.isDocked = false;
            me.managedState.canDock = true;
            undock.style.display = 'none';

        },function(err){
            console.warn(err);
        });

    }


    function subscribeToDockNoCandidate(fin, dock) {
        fin.desktop.InterApplicationBus.subscribe("snap-map", "dock-no-candidate:"+me.managedState.mainWindow.name, function (data) {

            if (!me.managedState.currentlyDocking  && !me.managedState.isDocked) {
                dock.style.display = 'none';
                //me.managedState.dockingTarget = false;
                me.managedState.canDock = false;
                console.warn('all alone... cant dock', data);
            }
        });//end subscribe

    }


    function subscribeToDockEligible(fin, dock){

        fin.desktop.InterApplicationBus.subscribe("snap-map", "dock:"+me.managedState.mainWindow.name, function (data) {

            if (!me.managedState.currentlyDocking && !me.managedState.isDocked) {

                var isDockShowing = dock.style.display === 'block';

                if(!isDockShowing) {dock.style.display = 'block';}

                me.managedState.dockingTarget = data;
                me.managedState.canDock = true;
                console.log('Ive been told to dock!', data);
            }
        });//end subscribe

    }


    function subscribeToDocking(fin){

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


    function registerBoundsChanging(fin) {

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

