/* 
 * System Designer
 * 
 * https://designfirst.io/systemdesigner/
 *
 * Copyright 2017 Erwan Carriou
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

runtime.on('ready', function () {
    var system = this.system('design');

    // MenuBar
    var MenuBar = this.require('MenuBar');
    MenuBar.on('init', function (conf) {
        var menuHeader = [],
            menuItems = [],
            menuActions = [],
            menuSearch = [],
            self = this;

        // menu header
        menuHeader = this.require('db').collections().MenuHeader.find({
            "type": this.designer().type()
        });
        this.header(this.require(menuHeader[0]._id));

        // menu items
        menuItems = this.require('db').collections().MenuItem.find({
            "type": this.designer().type()
        });

        menuItems.sort(function (itemA, itemB) {
            if (itemA.position > itemB.position) {
                return 1;
            }
            if (itemA.position < itemB.position) {
                return -1;
            }
            return 0;
        });

        menuItems.forEach(function (menuItem) {
            var id = menuItem._id;
            self.items().push(self.require(id));
        });

        // menu actions
        menuActions = this.require('db').collections().MenuAction.find({
            "type": this.designer().type()
        });

        menuSearch = this.require('db').collections().MenuSearch.find({
            "type": this.designer().type()
        });

        menuActions = menuActions.concat(menuSearch);

        menuActions.sort(function (itemA, itemB) {
            if (itemA.position > itemB.position) {
                return 1;
            }
            if (itemA.position < itemB.position) {
                return -1;
            }
            return 0;
        });

        menuActions.forEach(function (menuAction) {
            var id = menuAction._id;
            self.actions().push(self.require(id));
        });

    });

    MenuBar.on('render', function () {
        var length = 0,
            i = 0,
            item = null,
            domHeader = document.getElementById('designer-menubar-header'),
            domItems = document.getElementById('designer-menubar-items'),
            domAction = document.getElementById('designer-menubar-actions'),
            self = this;

        function _removeActive() {
            var length = 0,
                i = 0,
                item = null;

            length = domItems.children.length;
            for (i = 0; i < length; i++) {
                item = domItems.children[i];
                $(item).removeClass('active');
            }
        }

        // header
        domHeader.insertAdjacentHTML('afterbegin', this.header().html().source());

        this.items().forEach(function (item) {
            domItems.insertAdjacentHTML('beforeend', '<li>' + item.html().source() + '</>');
        });

        // events
        var callback = function () {
            _removeActive();
            $(this).addClass('active');
        };
        length = domItems.children.length;
        for (i = 0; i < length; i++) {
            item = domItems.children[i];
            item.addEventListener('click', callback);
            item.addEventListener('click', function () {
                this.click();
            }.bind(self.items(i)));
        }

        // actions
        this.actions().forEach(function (action) {
            domAction.insertAdjacentHTML('afterbegin', '<li>' + action.html().source() + '</>');
        });

        // focus on first element
        if (length > 0) {
            this.designer().context(this.items(0).name());
            item = domItems.children[0];
            $(item).addClass('active');
        }
    });

    // MenuItem
    var MenuItem = this.require('MenuItem');
    MenuItem.on('click', function () {
        var designer = this.require('designer'),
            editor = this.require('editor'),
            extra = null,
            oldContext = '',
            context = '',
            val = '';

        designer.oldContext(designer.context());
        designer.context(this.name());

        extra = designer.store().extra();
        oldContext = designer.oldContext();
        context = designer.context();
        val = editor.getValue();

        if (oldContext) {
            if (oldContext !== 'runtimeComponent') {
                if (extra[oldContext] === 'json') {
                    designer.store().data()[oldContext] = JSON.parse(editor.getValue());
                } else {
                    designer.store().data()[oldContext] = editor.getValue();
                }
            } else {
                designer.store().data(JSON.parse(editor.getValue()));
            }
        }

        component = designer.store().data();

        if (context !== 'runtimeComponent') {
            if (extra[context] === 'json') {
                editor.setEditor(extra[context], JSON.stringify(component[context], null, '\t'), 2);
            } else {
                editor.setEditor(extra[context], component[context], 1, true);
            }
        } else {
            editor.setEditor('json', JSON.stringify(designer.store().data(), null, '\t'), 2);
        }
    });

    // ToolBar
    var ToolBar = this.require('ToolBar');
    ToolBar.on('init', function (conf) {
        var toolBarItems = [],
            self = this;

        // items
        toolBarItems = this.require('db').collections().ToolBarItem.find({
            "type": this.designer().type()
        });

        // sort items
        toolBarItems.sort(function (itemA, itemB) {
            if (itemA.position > itemB.position) {
                return 1;
            }
            if (itemA.position < itemB.position) {
                return -1;
            }
            return 0;
        });

        toolBarItems.forEach(function (toolBarItem) {
            var id = toolBarItem._id;
            self.items().push(self.require(id));
        });
    });

    ToolBar.on('render', function () {
        var domItems = document.getElementById('designer-toolbar-items'),
            i = 0,
            length = 0,
            item = null,
            self = this;

        // items
        this.items().forEach(function (item) {
            domItems.insertAdjacentHTML('beforeend', '<li>' + item.html().source() + '</>');
        });

        // events
        length = domItems.children.length;
        for (i = 0; i < length; i++) {
            item = domItems.children[i];
            item.addEventListener('click', function () {
                this.click();
            }.bind(self.items(i)));
        }
    });

    // Workspace
    var Workspace = this.require('Workspace');
    Workspace.on('init', function (conf) {
        var Editor = null,
            designer = null,
            editor = null;

        Editor = this.require('Editor');
        designer = this.require('designer');

        if (designer.isCordova()) {
            editor = new Editor({
                '_id': 'editor',
                'type': 'codemirror',
                'context': 'component',
                'editor': CodeMirror($('#designer-editor')[0], {
                    lineNumbers: true,
                    styleActiveLine: true,
                    'mode': 'application/json',
                    'theme': 'eclipse',
                    'tabSize': 2,
                    'autoCloseBrackets': true
                })
            });
        } else {
            editor = new Editor({
                '_id': 'editor',
                'type': 'ace',
                'context': 'component',
                'editor': ace.edit('designer-editor')
            });
        }
    });

    Workspace.on('render', function () {
        this.require('editor').render();
    });

    // Server
    var Server = this.require('Server');
    Server.on('start', function () {
        var RuntimeChannel = null,
            channel = null,
            id = '',
            system = '',
            types = null,
            title = '',
            collection = '',
            self = this,
            designer = this.require('designer'),
            result = {},
            property = '',
            propName = '',
            editor = null;

        this.require('storage').on('changed', function (obj) {
            if (typeof obj['system-designer-message'] !== 'undefined') {
                $db.RuntimeMessage.insert(obj['system-designer-message'].newValue);
            }
        }, true);

        RuntimeChannel = this.require('RuntimeChannel');
        channel = new RuntimeChannel({
            '_id': 'channel'
        });

        channel.on('send', function (message) {
            if (message.event.indexOf('$system') !== 0) {
                var storage = this.require('storage'),
                    config = storage.get('system-designer-config'),
                    designer = this.require('designer'),
                    messages = [];

                storage.set('system-designer-message', message);

                if (designer.isCordova()) {
                    messages = designer.messages();
                    messages.push(message);
                    designer.messages(messages);
                }

                // message for server debug
                if (typeof config.debugType !== 'undefined' && config.debugType === 'server' && config.urlServer) {
                    $.post(config.urlServer + ':8888/' + message.event, encodeURIComponent(JSON.stringify(message.data)));
                }
            }
        });

        id = decodeURIComponent(document.location.href.split('#')[1].split('?')[0]);
        collection = document.location.href.split('#')[2].split('?')[0];
        systemId = document.location.href.split('#')[3].split('?')[0];

        system = this.require('storage').get(systemId);
        component = system.components[collection][id];
        model = designer.getGeneratedModel(collection);

        function _init(props) {
            var propName = '',
                position = 0,
                menuitem = null,
                arrId = [];

            if (Object.keys(props)) {
                // add menuitems
                for (propName in props) {
                    self.require('db').collections().HTML.insert({
                        "_id": "menu-item-property-" + propName + ".html",
                        "source": '<a id="designer-menu-item-property-' + propName + '" href="#' + propName + '">' + propName + '</a>'
                    });
                    arrId = self.require('db').collections().MenuItem.insert({
                        "name": propName,
                        "html": "menu-item-property-" + propName + ".html",
                        "position": position + 10,
                        "type": "component"
                    });
                    self.require('designer').menubar().items().push(self.require(arrId[0]));
                }

                // items
                var toto = self.require('designer').menubar().items().sort(function (itemA, itemB) {
                    var compA = runtime.require(itemA),
                        compB = runtime.require(itemB);

                    if (compA.position() > compB.position()) {
                        return 1;
                    }
                    if (compA.position() < compB.position()) {
                        return -1;
                    }
                    return 0;
                });
                // render
                self.require('designer').menubar().render();
            }
        }

        designer.store().uuid(id);
        designer.store().collection(collection);
        designer.store().data(component);
        
        for (property in component) {
            if (model[property] && model[property].type) {
                switch (true) {
                    case model[property].type === 'html':
                        result[property] = 'html';
                        break;
                    case model[property].type === 'javascript':
                        result[property] = 'javascript';
                        break;
                    case model[property].type === 'css':
                        result[property] = 'css';
                        break;
                    case model[property].type === 'json':
                        result[property] = 'json';
                        break;
                    case model[property].type === 'object':
                        result[property] = 'json';
                        break;
                    case model[property].type === 'text':
                        result[property] = 'text';
                        break;
                    //case Array.isArray(model[property].type):
                    //result[property] = 'array';
                    //break;
                    default:
                        // case of object / json type
                        types = system.types;
                        if (
                            types &&
                            typeof types[model[property].type] !== 'undefined' &&
                            (types[model[property].type].type === 'object' || types[model[property].type].type === 'json')
                        ) {
                            result[property] = 'json';
                        }
                        break;
                }
            }
        }

        designer.store().extra(result);
        _init(result);

        document.title = 'component ' + id + ' · system ' + system.name;

        editor = this.require('editor');
        if (Object.keys(result).length === 0) {
            editor.setEditor('json', JSON.stringify(component, null, '\t'), 2);
        } else {
            propName = Object.keys(result)[0];
            if (result[propName] === 'json') {
                editor.setEditor(result[propName], JSON.stringify(component[propName], null, '\t'), 2);
            } else {
                editor.setEditor(result[propName], component[propName], 1, true);
            }
        }
    }, true);

    // Designer
    var Designer = this.require('Designer');
    Designer.on('init', function (conf) {
        var Store = null,
            store = null,
            MenuBar = null,
            menubar = null,
            ToolBar = null,
            toolbar = null,
            Workspace = null,
            workspace = null,
            Server = null,
            server = null;

        // type
        this.type(window.location.href.split('.html')[0].split('/')[window.location.href.split('.html')[0].split('/').length - 1]);

        // store
        Store = this.require('Store');
        store = new Store();

        // menu
        MenuBar = this.require('MenuBar');
        menubar = new MenuBar({
            designer: this
        });
        ToolBar = this.require('ToolBar');
        toolbar = new ToolBar({
            designer: this
        });

        // workspace
        Workspace = this.require('Workspace');
        workspace = new Workspace({
            designer: this
        });

        // server
        Server = this.require('Server');
        server = new Server({
            'designer': this
        });

        this.store(store);
        this.menubar(menubar);
        this.toolbar(toolbar);
        this.workspace(workspace);
        this.server(server);
    });

    Designer.on('render', function () {
        var systemId = '',
            System = null,
            system = null,
            sys = null;

        if (this.isCordova()) {
            this.updateCordovaContext();
        }

        // set system
        systemId = document.location.href.split('#')[3].split('?')[0];
        system = this.require('storage').get(systemId);
        System = this.require('System');
        sys = new System(system);
        this.system(sys);

        this.toolbar().render();
        this.workspace().render();
        this.server().start();
        this.updateRouter();

        $(function () {
            $('[data-toggle="tooltip"]').tooltip({ 'container': 'body', delay: { "show": 1000, "hide": 100 } });
        });
    });

    Designer.on('updateRouter', function () {
        var menubar = [],
            i = 0,
            length = 0,
            id = '',
            systemId = '',
            href = '';

        id = decodeURIComponent(document.location.href.split('#')[1]);
        collection = document.location.href.split('#')[2];
        systemId = document.location.href.split('#')[3].split('?')[0];

        // update menubar
        menubar = $('#designer-menubar-items > li > a');
        length = menubar.length;
        for (i = 0; i < length; i++) {
            href = menubar[i].href;
            context = href.split('#')[href.split('#').length - 1];
            menubar[i].href = '#' + id + '#' + collection + '#' + systemId + '#' + context;
        }
    });

    Designer.on('clear', function () {
        this.refresh();
    });

    Designer.on('context', function (val) {
        this.workspace().clear();
        this.workspace().refresh();
    });

    Designer.on('save', function () {
        var val = this.require('editor').getValue(),
            designer = this.require('designer'),
            message = this.require('message'),
            store = designer.store().data(),
            extra = designer.store().extra();

        if (designer.context() === 'runtimeComponent') {
            try {
                store = JSON.parse(val);
            } catch (e) {
                message.danger('Can not save your component: your component has an invalid structure.');
                return;
            }

            if (!store._id) {
                message.danger('The property \'_id\' is missing.');
                return;
            }
            if (store._id && store._id.indexOf(' ') !== -1) {
                message.danger('Invalid \'_id\'. <br>Space is not authorized in the value of \'_id\'.');
                return;
            }
        } else {
            if (extra[designer.context()] === 'json') {
                store[designer.context()] = JSON.parse(val);
            } else {
                store[designer.context()] = val;
            }
        }
        designer.store().data(store);

        // check if ID change
        if (designer.store().uuid() !== designer.store().data()._id) {
            this.require('channel').$editorDeleteComponent(designer.store().uuid(), designer.store().collection());
            designer.store().uuid(designer.store().data()._id);

            // update title
            document.title = 'component ' + designer.store().uuid() + ' · ' + document.title.split('·')[1].trim();
        }

        this.require('channel').$editorUpdateComponent(designer.store().uuid(), designer.store().collection(), designer.store().data());
        this.require('message').clean();
        this.require('message').success('Component saved.');
    });

    // start
    system.on('start', function start() {
        var Designer = null,
            designer = null;

        Designer = this.require('Designer');
        designer = new Designer({
            '_id': 'designer'
        });
        designer.render();
    });

    system.start();
});