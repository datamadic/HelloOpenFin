var dockingAdapter = (function(){

    var me = {};
    me.managedState = {
        dockingTarget : false,
        canDock : false,
        currentlyDocking : false,
        isDocked : false

    };

    me.init = function(mainWindow, fin, document){
        console.warn('initting');
        me.managedState.mainWindow = mainWindow;

        me.managedState.mainWindow.getBounds(function(bounds){


            fin.desktop.InterApplicationBus.publish( "dock-subscribe", {
                name : me.managedState.mainWindow.name,
                app_uuid : me.managedState.mainWindow.app_uuid,
                location:  bounds
            });
        },
        function(err){
            console.log('the err', err)
        });

        me.managedState.mainWindow.addEventListener('bounds-changing', function(data) {
            //console.log('on the move ', data);

            me.managedState.mainWindow.getBounds(function(bounds){

                //console.log('where im at', bounds);

                fin.desktop.InterApplicationBus.publish( "dock-window-move", {
                    bounds : bounds,
                    name : me.managedState.mainWindow.name
                });


            },
            function(err){
                console.log('the err', err)
            });
        }); //end bounds changing






        var draggableArea = document.querySelector('.container'),
        dock = document.querySelector('.dock'),
        undock = document.querySelector('.undock');


        //set the drag animations.
        me.managedState.mainWindow.defineDraggableArea(draggableArea, function(data) {
            me.managedState.mainWindow.animate({
                opacity: .7,
            }, {
                interrupt: false
            });
        }, function(data) {
            me.managedState.mainWindow.animate({
                opacity: 1
            }, {
                interrupt: false
            });
            mouseUpOnDraggable();
        }, function(err) {
            console.log(err);
        });

        //WindowFactory.create({name:"asdfasdfa",url:"views/cpu.html",autoShow:true});

        undock.addEventListener('click',undockWindow);

        function undockWindow(){
            console.warn('undock?!');
            me.managedState.mainWindow.leaveGroup(function(){

                fin.desktop.InterApplicationBus.publish( "dock-undocked", {
                    target : me.managedState.dockingTarget.dockee.name,
                    name : me.managedState.mainWindow.name
                });

                me.managedState.isDocked = false;
                me.managedState.canDock = true;

                //dock.style.display = 'block';
                undock.style.display = 'none';


            },function(err){
                console.warn(err);
            });

        }

        function mouseUpOnDraggable(){
            console.warn('mouse up on draggable');

            if (me.managedState.canDock && !me.managedState.isDocked){
                console.warn('the mouse has been upped',me.managedState.dockingTarget);

                me.managedState.currentlyDocking = true;
                var destination = {
                    top: me.managedState.dockingTarget.bounds.top,
                    left: me.managedState.dockingTarget.bounds.left + me.managedState.dockingTarget.bounds.width,
                    duration: 500
                };

                me.managedState.mainWindow.animate({
                    opacity: .7,
                    position: destination
                }, {
                    interrupt: true
                },
                function(evt) {

                    me.managedState.mainWindow.getBounds(function(bounds){

                        var topGood = (bounds.top === me.managedState.dockingTarget.bounds.top),
                        leftGood = (bounds.left === me.managedState.dockingTarget.bounds.left + me.managedState.dockingTarget.bounds.width);

                        if (topGood && leftGood) {



                            console.warn('this is the DockingTarget in the callback:' , me.managedState.dockingTarget);
                            var dockingWindow = fin.desktop.Window.wrap(me.managedState.dockingTarget.dockee.app_uuid,me.managedState.dockingTarget.dockee.name);

                            //debugger

                            me.managedState.mainWindow.joinGroup(dockingWindow, function(){

                                console.warn('this is the DockingTarget in the JOIN callback:' , me.managedState);

                                dock.style.display = 'none';
                                undock.style.display = 'block';

                                fin.desktop.InterApplicationBus.publish( "dock-docked", {
                                    target : me.managedState.dockingTarget.dockee.name,
                                    name : me.managedState.mainWindow.name
                                });

                                me.managedState.currentlyDocking = false;
                                me.managedState.isDocked = true;
                                me.managedState.canDock = false;
                                //me.managedState.dockingTarget = false;

                                // me.managedState.mainWindow.animate({
                                //     opacity: 1
                                // });

                                console.warn('it grouped just fine');
                            },
                            function(reason){
                                console.warn('it did not group', reason);
                            });



                        }//end if top left good
                        else {
                            console.warn('im not where I thought Id be ', bounds , me.managedState.dockingTarget.bounds);
                        }
                    },
                    function(err){
                        console.warn('the err of the bounds ',err);
                    });


});

            }//end if docking target
        }


        fin.desktop.InterApplicationBus.subscribe("snap-map", "dock:"+me.managedState.mainWindow.name, function (data) {



            if (!me.managedState.currentlyDocking && !me.managedState.isDocked) {
                dock.style.display = 'block';
                me.managedState.dockingTarget = data;
                me.managedState.canDock = true;
                console.log('Ive been told to dock!', data);
            }



        });//end subscribe
        fin.desktop.InterApplicationBus.subscribe("snap-map", "dock-no-candidate:"+me.managedState.mainWindow.name, function (data) {

            if (!me.managedState.currentlyDocking  && !me.managedState.isDocked) {
                dock.style.display = 'none';
                //me.managedState.dockingTarget = false;
                me.managedState.canDock = false;
                console.warn('all alone... cant dock', data);
            }



        });//end subscribe


    }//end init

    return me;

})()
