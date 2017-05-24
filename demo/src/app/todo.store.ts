import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

export class Todo {
  $key?: string;
  title?: string;
  completed?: boolean;
  editing: boolean;

  constructor(title: string) {
    this.completed = false;
    this.title = title.trim();
  }
}

@Injectable()
export class TodoStore {
  todos: FirebaseListObservable<Todo[]>;

  constructor(private db: AngularFireDatabase) {
    this.todos = db.list('/todos');
  }

  add(title: string) {
    let todo = new Todo(title);
    this.todos.push(todo);
  }

  complete(todo: Todo) {
    todo.completed = true;
    this.db.object(`/todos/${todo.$key}`).update(todo);
  }

  update(todo: Todo) {
    todo.editing = false;
    this.db.object(`/todos/${todo.$key}`).update(todo);
  }

  remove(todo: Todo) {
    this.todos.remove(todo.$key);
  }
}