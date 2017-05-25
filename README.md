# Building and Deploying Angular Applications

<img align="left" src="https://secure.meetupstatic.com/photos/event/6/e/3/e/global_133288222.jpeg">

[A talk for the Coded-In-Braam meetup on 27 May 2017](https://www.meetup.com/CodedInBraam/events/239689672/).

In the world of JavaScript, things have become more complicated. There are a lot of moving parts in a modern single page application that make building, debugging and ultimately deploying seem like a significant challenge. There are very good reasons behind this complexity, however. Modern frameworks, such as Angular, have created rich and featureful tool chains that make the process much easier.

Using Angular, we will show you how to use modern tooling to simplify the building and debugging of an application - including using TypeScript, the Angular CLI, WebPack, Visual Studio Code and Chrome Developer Tools. We will then look at different ways of deploying the application, such as to Firebase CDN and GitHub Pages - and the pros and cons of each.

[@mikegeyser](https://twitter.com/mikegeyser)

# Setup
## Install @angular/cli

The first thing we have to do is install the `@angular/cli` globally to make use of the scaffolding on the terminal.

```bash
  > npm install --global @angular/cli
  > ng help
```

## Scaffold out new project

We can scaffold out the project using a number of optional switches to tweak our defaults, but in this case we will try and generate the simplest possible base project.

In this we are only using the `@angular/cli` minimally to generate and build the project, to find out more go take a look at: [https://cli.angular.io/](https://cli.angular.io/)
```bash
  > ng new todo --directory demo --inline-style --skip-tests --skip-install
  > cd demo/
  > rm -rf e2e/ karma.conf.js protractor.conf.js README.md
  > npm install
  > ng serve
```

Browse to [http://localhost:4200/](http://localhost:4200/)

## Update to include the styling on `index.html`

This application is going to follow along with one of my favourite front-end code katas, namely TodoMVC. 
We will be building a simple Todo Application with a predefined set of functionality.
To concentrate on the building of the application, rather than fiddling with the appearance, the custodians have made their CSS available as an `npm` package - which we're going to install below.

```bash
  > npm install --save todomvc-app-css todomvc-common
```

#### .angular-cli.json

In order for the `@angular/cli` (or rather WebPack, that's embedded in the cli) to push the styles to the page, we need to add it to the external styles section of the `.angular-cli.json` config file.
```json
    "styles": [
      "styles.css",
      "../node_modules/todomvc-common/base.css",
      "../node_modules/todomvc-app-css/index.css"
    ],
```

Now if you look at the application, the styles should be updated!

# List the todos

The first thing we are going to do is display the todos as a list.

## Create the store
#### src/app/todo.store.ts
We need to create an abstraction layer for the todo data storage, so we create an `angular` injected service that's going to do this for us.

> demo-store
```TypeScript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

export class Todo {
  id?: string;
  title?: string;
  completed?: boolean;

  constructor(title: string) {
    this.completed = false;
    this.title = title.trim();
  }
}

@Injectable()
export class TodoStore {
  todos: Todo[] = [ new Todo("This is a test?") ];

  constructor() { }
}
```

#### src/app/app.module.ts

We then need to `import` the `TodoStore` and register it as a `provider` for the application's root module.

```TypeScript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { TodoStore } from './todo.store';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [TodoStore],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

#### src/app/app.component.ts

We can then use the `TodoStore` by injecting it into the constructor of the `AppComponent` and marking it as public, which is a shortcut that will create it as a `property` on the component.

```TypeScript
import { Component } from '@angular/core';
import { TodoStore, Todo } from './todo.store';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  constructor(public store: TodoStore) { }
}
```

#### src/app/app.component.html

Next, we create some simple markup that's the standard container structure for the `TodoMVC` kata. 
Importantly, iterate over the todos array from the `TodoStore` directly by using an `*ngFor` directive, and print the title using the handlebar notation `{{todo.title}}`.
> demo-html-skeleton
```html
<section class="todoapp">
  
  <header class="header">
    <h1>todos</h1>
  </header>

  <section class="main">
    <ul class="todo-list">
      <li *ngFor="let todo of store.todos" 
          [class.completed]="todo.completed" 
          [class.editing]="todo.editing">
        <div class="view">
          <input class="toggle" 
                 type="checkbox" >
          <label>{{todo.title}}</label>
        </div>
      </li>
    </ul>
  </section>
  
</section>

```

## Set up Firebase

For the next section, we are going to wire up *FireBase* as our back-end for the application.
The instructions presented below are abbreviated to the bare minimum.
If you'd like to see more detailed instructions, please go to: [https://firebase.google.com/docs/web/setup](https://firebase.google.com/docs/web/setup).

> ## NB: You are going to have to sign up for an account at this stage, [if you leave it on *Spark* you won't be billed](https://firebase.google.com/pricing/).

Install the firebase cli tools globally.
```bash
  > npm install --global firebase-tools
```

Login to your account and then (from the app directory) initialise firebase.
```bash
  > firebase login
  > firebase init
```

Save the *angularfire 2* and supporting packages to the application, which will give us access to all of the cool firebase integration.
```bash
  > npm install --save firebase angularfire2 promise-polyfill
```

#### src/app/todo.store.ts
The first thing we'll do is `import` the relevant angularfire classes into our `TodoStore`.
> demo-store-import-firebase
```TypeScript
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
```

Then we'll replace the `class` contents with the code below, changing the `todos` array to a `FirebaseListObservable`.
We will need to inject an instance of the `AngularFireDatabase` client and will call list and give it the relative path to our `todos/` store.
For those of you that have worked with any kind of AJAX or REST before, this _should_ feel like a RESTful endpoint (because it is).

> demo-store-todos
```TypeScript
	todos: FirebaseListObservable<Todo[]>;

	constructor(private db: AngularFireDatabase) {
		this.todos = db.list('/todos');
	}
```

#### src/app/app.module.ts
The angular fire modules need to be imported in the root module.
> demo-module-import-firebase
```TypeScript
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
```

And initialised with our firebase config in the `imports` section of the module.
> demo-module-set-imports
```TypeScript
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule
  ],
```

#### src/environments/environments.ts
We need to put our firebase token details somewhere, and the right place is in the `environments.ts` file.
You'll find the details of these settings on your [firebase console](https://console.firebase.google.com/).
> demo-environment-firebase
```TypeScript
  firebase: {
    apiKey: "{Your data here}",
    authDomain: "{Your data here}",
    databaseURL: "{Your data here}",
    projectId: "{Your data here}",
    storageBucket: "{Your data here}",
    messagingSenderId: "{Your data here}"
  }
```

### src/app/app.component.html
Lastly, we need to add an `async` pipe to our html, so that angular knows that it will need to wait for the `Observable` to fire before it starts rendering items.
This is an incredibly powerful aspect of angular, although tricky to get to grips with.
```TypeScript
  *ngFor="let todo of store.todos | async" 
```

And now you should have your `TodoMVC` app bound to a cloud db. 
If you create todos in the console, you should see the list updated with them.

# Add a todo

#### src/app/app.component.html
> demo-html-add
```html
<input class="new-todo" 
       placeholder="What needs to be done?" 
       autofocus="" 
       [(ngModel)]="newTodoText" 
       (keyup.enter)="addTodo()">
```

#### src/app/app.component.ts
```TypeScript
public newTodoText : string;
```
> demo-component-add
```TypeScript
  addTodo(){
    if (this.newTodoText.trim().length) {
      this.store.add(this.newTodoText);
      this.newTodoText = '';
    }
  }
```

#### src/app/todo.store.ts
> demo-store-add
```TypeScript
	add(title: string) {
		let todo = new Todo(title);
		this.todos.push(todo);
	}
```

# Mark a todo as complete
#### src/app/app.component.html
> demo-html-complete
```TypeScript
<input class="toggle" 
       type="checkbox" 
       (click)="toggleCompletion(todo)" 
       [checked]="todo.completed">
```

#### src/app/app.component.ts
> demo-component-complete
```TypeScript
  toggleCompletion(todo: Todo) {
    this.store.complete(todo);
  }
```

#### src/app/todo.store.ts
> demo-store-complete
```TypeScript
	complete(todo: Todo) {
		todo.completed = true;
		this.db.object(`/todos/${todo.$key}`).update(todo);
	}
```

# Edit a todo
#### src/app/app.component.html
> demo-html-edit-1
```html
<label (dblclick)="editTodo(todo)">{{todo.title}}</label>
```
> demo-html-edit-2
```html
<input class="edit" 
       *ngIf="todo.editing" 
       [value]="todo.title" 
       #editedtodo 
       (blur)="completeEditing(todo, editedtodo.value)" 
       (keyup.enter)="completeEditing(todo, editedtodo.value)"
       (keyup.escape)="cancelEditingTodo(todo)">
```
#### src/app/app.component.ts
> demo-component-edit1
```TypeScript
  editTodo(todo: Todo) {
    todo.editing = true;
  }
```
> demo-component-edit2
```TypeScript
  cancelEditingTodo(todo: Todo) {
    todo.editing = false;
  }
```
> demo-component-edit3
```TypeScript
  completeEditing(todo: Todo, editedTitle: string) {
    todo.title = editedTitle;
    this.store.update(todo);
  }
```

#### src/app/todo.store.ts
```TypeScript
  editing?: boolean;
```
> demo-store-edit
```TypeScript
	update(todo: Todo) {
		todo.editing = false;
		this.db.object(`/todos/${todo.$key}`).update(todo);
	}
```

# Delete a todo
#### src/app/app.component.html
> demo-html-delete
```html
  <button class="destroy" (click)="remove(todo)"></button>
```

#### src/app/app.component.ts
> 
```TypeScript
  remove(todo: Todo) {
    this.store.remove(todo);
  }
```
#### src/app/todo.store.ts
> demo-store-delete
```TypeScript
	remove(todo: Todo) {
		this.todos.remove(todo.$key);
	}
```

# Deploy the application


```bash
  > ng build [--prod]
  > firebase deploy
```
