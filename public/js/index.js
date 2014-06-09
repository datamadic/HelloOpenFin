var dockingAdapter = dockingAdapter || {};

(function(dockingAdapter) {
    'use strict';
    document.addEventListener('DOMContentLoaded', function() {

        //OpenFin is ready.
        fin.desktop.main(function() {
            //request the windows.
            var mainWindow = fin.desktop.Window.getCurrent(),
                //draggableArea = document.querySelector('.container'),
                //start the cpu window in a hidded state
                cpuWindow = WindowFactory.create({
                    "name": "cpuChild",
                    "url": 'views/cpu.html'
                });




            //set up window move effects.
            //utils.registerDragHandler(mainWindow);

            //register the event handlers.
            setEventHandlers(mainWindow, cpuWindow);

            //set the drag animations.
            // mainWindow.defineDraggableArea(draggableArea, function(data) {
            //     mainWindow.animate({
            //         opacity: utils.transparentOpacityAnimation,
            //     }, {
            //         interrupt: false
            //     });
            // }, function(data) {
            //     mainWindow.animate({
            //         opacity: utils.solidOpacityAnimation
            //     }, {
            //         interrupt: false
            //     });
            // }, function(err) {
            //     console.log(err);
            // });

            //show the main window now that we are ready.
            mainWindow.show();

            //*****************************************************************
            // the playground starts here ...
            //*****************************************************************

            var dock = document.querySelector('.dock'),
                undock = document.querySelector('.undock');

            undock.addEventListener('click',function(){
                //do some app specific stuff here ...

                //then call the adapter undocking function
                 dockingAdapter.undock();
            });

            dockingAdapter.init({
                mainWindow : mainWindow,
                fin : fin,
                onDockCandidate : function(){
                    var isDockShowing = dock.style.display === 'block';

                    if(!isDockShowing) {
                        dock.style.display = 'block';
                    }
                },
                onNoDockCandidate : function(){
                    dock.style.display = 'none';
                },
                onDocked : function(){
                    dock.style.display = 'none';
                    undock.style.display = 'block';
                },
                onUnDocked : function(){
                    undock.style.display = 'none';
                }
            });

            //*****************************************************************
            // all the same after here...
            //*****************************************************************


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
}(dockingAdapter));
