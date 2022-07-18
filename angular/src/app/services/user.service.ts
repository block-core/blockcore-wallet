import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }

  getUser(username: string): User {
    return this.getUsers().find(u => u.username === username);
  }

  getUsers(): User[] {
    const usersString  = localStorage.getItem('users');
    return usersString ? JSON.parse(usersString) : [];
  }

  saveUsers(users: User[]) {
    return localStorage.setItem('users', JSON.stringify(users));
  }

  addUser(user: User) {
    const users = [...this.getUsers(), user];
    this.saveUsers(users);
  }

  removeUser(username: string) {
    const filteredUsers = this.getUsers().filter(user => user.username !== username);
    this.saveUsers(filteredUsers);
  }
}
