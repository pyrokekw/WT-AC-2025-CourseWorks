from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app
from .extensions import db
from .models import User

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # use .get to avoid KeyError
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        if not username or not email or not password:
            flash('Please fill all fields')
            return redirect(url_for('auth.register'))
        user_by_name = User.query.filter_by(username=username).first()
        user_by_email = User.query.filter_by(email=email).first()
        if user_by_name:
            flash('Username exists')
            return redirect(url_for('auth.register'))
        if user_by_email:
            flash('Email exists')
            return redirect(url_for('auth.register'))
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        session['user_id'] = user.id
        flash('Registered')
        return redirect(url_for('main.index'))
    return render_template('register.html')


@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter((User.username == username) | (User.email == username)).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            flash('Logged in')
            return redirect(url_for('main.index'))
        flash('Invalid credentials')
        return redirect(url_for('auth.login'))
    return render_template('login.html')


@bp.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Logged out')
    return redirect(url_for('main.index'))
