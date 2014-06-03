(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function() {

        //OpenFin is ready.
        fin.desktop.main(function() {
            //request the windows.
            var mainWindow = fin.desktop.Window.getCurrent(),
                draggableArea = document.querySelector('.container'),
                //start the cpu window in a hidded state
                cpuWindow = WindowFactory.create({
                    "name": "cpuChild",
                    "url": 'views/cpu.html',
                });


            console.log('I created this cpu window', cpuWindow);


            //function subscribeToDocking(mainWindow){

                //console.log('this is the main window in here ', mainWindow);

                mainWindow.getBounds(function(bounds){

                    console.log('where im at', bounds);
                    console.log('this is the main window in here ', mainWindow);
                    fin.desktop.InterApplicationBus.publish( "dock-subscribe", {
                        name : mainWindow.name,
                        app_uuid : mainWindow.app_uuid,
                        location:  bounds
                    });
                },
                function(err){
                    console.log('the err', err)
                });

            //}

            console.log('this is the main window', mainWindow);

            mainWindow.addEventListener('bounds-changing', function(data) {

                mainWindow.getBounds(function(bounds){

                    console.log('where im at', bounds);

                    fin.desktop.InterApplicationBus.publish( "dock-window-move", {
                        bounds : bounds,
                        name : mainWindow.name
                    });

                },
                function(err){
                    console.log('the err', err)
                });

            });

            fin.desktop.InterApplicationBus.subscribe("snap-map", "dock-to", function (data) {
                //console.log('Ive been told to dock!', data);

                var windowList = [mainWindow];

                fin.desktop.Application.getCurrent()
                    .getChildWindows(function(children){
                        var docker, dockee;

                        console.log('this is for a dock', children, typeof children);

                        if (children) {
                            windowList = windowList.concat(children);
                            console.log('this is the windowList', windowList);

                            var dockMap = _.object(_.map(windowList, function(wnd){
                                return [wnd.name, wnd];
                            }));
                            console.log('this is the dockMap', dockMap, data);

                            console.log('this is the docker deal', dockMap[data.docker])
                            docker = dockMap[data.docker];
                            dockee = dockMap[data.dockee];
                            _.once(docker.joinGroup(dockee));

                        }//end if children


                    })//end getChildWindows


            });//end subscribe

            //set up window move effects.
            //utils.registerDragHandler(mainWindow);

            //register the event handlers.
            setEventHandlers(mainWindow, cpuWindow);

            //set the drag animations.
            mainWindow.defineDraggableArea(draggableArea, function(data) {
                mainWindow.animate({
                    opacity: utils.transparentOpacityAnimation,
                }, {
                    interrupt: false
                });
            }, function(data) {
                mainWindow.animate({
                    opacity: utils.solidOpacityAnimation
                }, {
                    interrupt: false
                });
            }, function(err) {
                console.log(err);
            });

            //show the main window now that we are ready.
            mainWindow.show();
        });

        //set event handlers for the different buttons.
        var setEventHandlers = function(mainWindow, cpuWindow) {
            //Buttons and components.
            var desktopNotificationButton = document.getElementById('desktop-notification'),
                cpuInfoButton = document.getElementById('cpu-info'),
                closeButton = document.getElementById('close-app'),
                arrangeWindowsButton = document.getElementById('arrange-windows'),
                minimizeButton = document.getElementById('minimize-window');

            //Close button event handler
            closeButton.addEventListener('click', function() {
                mainWindow.close();
            });

            //Minimize button event handler
            minimizeButton.addEventListener('click', function() {
                mainWindow.minimize();
            });

            //Desktop notification event handler
            desktopNotificationButton.addEventListener('click', function() {
                var notification = new fin.desktop.Notification({
                    url: '/views/notification.html',
                    message: 'Notification from app'
                });
            });

            //Cpu information button.
            cpuInfoButton.addEventListener('click', function() {
                cpuWindow.isShowing(function(showing) {
                    if (!showing) {
                        mainWindow.getBounds(function(bounds) {
                            cpuWindow.moveTo(bounds.left + bounds.width + utils.cpuWindowMargin, bounds.top, function() {
                                cpuWindow.show();
                            });
                        });
                    }
                });
            });

            //Arrange windows in the desktop.
            arrangeWindowsButton.addEventListener('click', function() {
                //move them to the top left by default, if windows are there move to bottom right.
                fin.desktop.System.getMonitorInfo(function(monitorInfo) {
                    mainWindow.getBounds(function(mainWindowBounds) {
                        cpuWindow.getBounds(function(cpuWindowBounds) {
                            animateWindows({
                                monitorInfo: monitorInfo,
                                mainWindowBounds: mainWindowBounds,
                                cpuWindowBounds: cpuWindowBounds,
                                mainWindow: mainWindow,
                                cpuWindow: cpuWindow
                            });
                        });
                    });
                });
            });
        };

        //animates both windows.
        var animateWindows = function(options) {
            //expects an options object with the following shape:
            // {
            //     monitorInfo,
            //     mainWindowBounds,
            //     cpuWindowBounds,
            //     mainWindow,
            //     cpuWindow
            // }
            var destination = {
                top: 0,
                left: 0,
                duration: 1000
            };

            //check the position and adjust the destination.
            if (options.mainWindowBounds.top === destination.top && options.mainWindowBounds.left === destination.left) {
                destination.top = options.monitorInfo.primaryMonitor.availableRect.bottom - options.mainWindowBounds.height;
                destination.left = options.monitorInfo.primaryMonitor.availableRect.right - options.mainWindowBounds.width;
            }

            //animate the main window.
            options.mainWindow.animate({
                    opacity: utils.transparentOpacityAnimation,
                    position: destination
                }, {
                    interrupt: true
                },
                function(evt) {
                    options.mainWindow.animate({
                        opacity: utils.solidOpacityAnimation
                    });
                });

            //update destination for the cpuWindow.
            if (destination.left < options.mainWindowBounds.width) {
                destination.left += (options.mainWindowBounds.width + utils.cpuWindowMargin);
            } else {
                destination.left -= (options.cpuWindowBounds.width + utils.cpuWindowMargin);
            }
            //animate the cpu child window.
            options.cpuWindow.animate({
                opacity: utils.transparentOpacityAnimation,
                position: destination
            }, {
                interrupt: true
            }, function(evt) {
                options.cpuWindow.animate({
                    opacity: utils.solidOpacityAnimation
                });
            });
        };
    });
}());
