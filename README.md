# Building and Deploying Angular Applications

<img align="left" src="https://secure.meetupstatic.com/photos/event/6/e/3/e/global_133288222.jpeg">

[A talk for the Coded-In-Braam meetup on 27 May 2017](https://www.meetup.com/CodedInBraam/events/239689672/).

In the world of JavaScript, things have become more complicated. There are a lot of moving parts in a modern single page application that make building, debugging and ultimately deploying seem like a significant challenge. There are very good reasons behind this complexity, however. Modern frameworks, such as Angular, have created rich and featureful tool chains that make the process much easier.

Using Angular, we will show you how to use modern tooling to simplify the building and debugging of an application - including using TypeScript, the Angular CLI, WebPack, Visual Studio Code and Chrome Developer Tools. We will then look at different ways of deploying the application, such as to Firebase CDN and GitHub Pages - and the pros and cons of each.

<a href="https://twitter.com/mikegeyser">
<svg viewBox="328 355 335 276" xmlns="http://www.w3.org/2000/svg" width="16">
  <path d="
    M 630, 425
    A 195, 195 0 0 1 331, 600
    A 142, 142 0 0 0 428, 570
    A  70,  70 0 0 1 370, 523
    A  70,  70 0 0 0 401, 521
    A  70,  70 0 0 1 344, 455
    A  70,  70 0 0 0 372, 460
    A  70,  70 0 0 1 354, 370
    A 195, 195 0 0 0 495, 442
    A  67,  67 0 0 1 611, 380
    A 117, 117 0 0 0 654, 363
    A  65,  65 0 0 1 623, 401
    A 117, 117 0 0 0 662, 390
    A  65,  65 0 0 1 630, 425
    Z"
    style="fill:#3BA9EE;"/>
</svg>
@mikegeyser
</a>

# Setup
## Install @angular/cli

```bash
  > npm install --global @angular/cli
  > ng help
```

## Scaffold out new project

```bash
  > ng new todo --directory demo --inline-style --skip-tests --skip-install
  > cd demo/
  > rm -rf e2e/ karma.conf.js protractor.conf.js README.md
  > npm install
  > ng serve
```

Browse to [http://localhost:4200/](http://localhost:4200/)

## Update to include the styling on `index.html`

```bash
  > npm install --save todomvc-app-css todomvc-common
```

#### .angular-cli.json
```json
    "styles": [
      "styles.css",
      "../node_modules/todomvc-common/base.css",
      "../node_modules/todomvc-app-css/index.css"
    ],
```

# List the todos
## Create the store
#### src/app/todo.store.ts
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

[https://firebase.google.com/](https://firebase.google.com/)

```bash
  > npm install --global firebase-tools
```

```bash
  > firebase login
  > firebase init
  $ firebase init
```

```bash
  > npm install --save firebase angularfire2 promise-polyfill
```

#### src/app/todo.store.ts
> demo-store-import-firebase
```TypeScript
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
```

> demo-store-todos
```TypeScript
	todos: FirebaseListObservable<Todo[]>;

	constructor(private db: AngularFireDatabase) {
		this.todos = db.list('/todos');
	}
```

#### src/app/app.module.ts
> demo-module-import-firebase
```TypeScript
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
```

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
```TypeScript
  *ngFor="let todo of store.todos | async" 
```

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
