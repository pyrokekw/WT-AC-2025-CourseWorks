from flask import current_app as app
from flask import render_template, request, redirect, url_for, session, flash, jsonify
from .extensions import db
from .models import Course, Lesson, Progress, Comment, User, Test, Question, Option, Attempt
from flask import Blueprint
import datetime

bp = Blueprint('main', __name__)


@bp.route('/')
def index():
    courses = Course.query.all()
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    return render_template('index.html', courses=courses, user=user)


@bp.route('/courses/<int:course_id>')
def course_detail(course_id):
    course = Course.query.get_or_404(course_id)
    user = None
    completed_ids = set()
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        # gather completed lessons for this user
        completed = Progress.query.filter_by(user_id=user.id, completed=True).all()
        completed_ids = {p.lesson_id for p in completed}
    return render_template('course.html', course=course, user=user, completed_ids=completed_ids)


@bp.route('/courses/<int:course_id>/tests')
def course_tests(course_id):
    course = Course.query.get_or_404(course_id)
    tests = Test.query.filter_by(course_id=course_id).all()
    return render_template('tests_list.html', course=course, tests=tests)


@bp.route('/tests/<int:test_id>', methods=['GET', 'POST'])
def take_test(test_id):
    test = Test.query.get_or_404(test_id)
    if request.method == 'POST':
        # collect answers
        answers = {}
        for q in test.questions:
            key = f'q_{q.id}'
            val = request.form.get(key)
            if val:
                answers[q.id] = int(val)
        # grade
        correct = 0
        total = len(test.questions)
        for q in test.questions:
            selected_opt = answers.get(q.id)
            if selected_opt:
                opt = Option.query.get(selected_opt)
                if opt and opt.is_correct:
                    correct += 1
        # save attempt
        attempt = Attempt(user_id=session.get('user_id'), test_id=test.id, score=correct, total=total)
        db.session.add(attempt)
        db.session.commit()
        return render_template('test_result.html', test=test, correct=correct, total=total)
    return render_template('test.html', test=test)


@bp.route('/openapi.json')
def openapi_spec():
    spec = {
        'openapi': '3.0.0',
        'info': {'title': 'MiniCourses API', 'version': '1.0.0'},
        'paths': {
            '/': {'get': {'summary': 'Home'}} ,
            '/courses': {'get': {'summary': 'List courses'}},
            '/courses/{course_id}': {'get': {'summary': 'Course detail'}},
            '/lessons/{lesson_id}': {'get': {'summary': 'Lesson detail'}, 'post': {'summary': 'Mark completed'}},
            '/register': {'post': {'summary': 'Register user'}},
            '/login': {'post': {'summary': 'Login user'}},
            '/tests/{test_id}': {'get': {'summary': 'Get test'}, 'post': {'summary': 'Submit test'}}
        }
    }
    return jsonify(spec)


@bp.route('/swagger')
def swagger_ui():
    return render_template('swagger.html')


@bp.route('/lessons/<int:lesson_id>', methods=['GET', 'POST'])
def lesson_detail(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    user = None
    completed = False
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        p = Progress.query.filter_by(user_id=user.id, lesson_id=lesson.id).first()
        completed = bool(p and p.completed)
    if request.method == 'POST':
        if not user:
            flash('Login required')
            return redirect(url_for('auth.login'))
        # mark progress
        p = Progress.query.filter_by(user_id=user.id, lesson_id=lesson.id).first()
        if not p:
            p = Progress(user_id=user.id, lesson_id=lesson.id, completed=True)
            db.session.add(p)
        else:
            p.completed = True
        db.session.commit()
        flash('Marked as completed')
        return redirect(url_for('main.lesson_detail', lesson_id=lesson.id))

    comments = Comment.query.filter_by(lesson_id=lesson.id).all()
    return render_template('lesson.html', lesson=lesson, user=user, comments=comments, completed=completed)


@bp.route('/lessons/<int:lesson_id>/complete', methods=['POST'])
def lesson_complete_ajax(lesson_id):
    if 'user_id' not in session:
        return jsonify({'error': 'login required'}), 401
    lesson = Lesson.query.get_or_404(lesson_id)
    user_id = session['user_id']
    p = Progress.query.filter_by(user_id=user_id, lesson_id=lesson.id).first()
    if not p:
        p = Progress(user_id=user_id, lesson_id=lesson.id, completed=True)
        db.session.add(p)
    else:
        p.completed = True
    db.session.commit()
    return jsonify({'status': 'ok', 'completed': True, 'lesson_id': lesson.id})


@bp.route('/lessons/<int:lesson_id>/comment', methods=['POST'])
def lesson_comment(lesson_id):
    if 'user_id' not in session:
        flash('Login required')
        return redirect(url_for('auth.login'))
    content = request.form.get('content')
    if not content:
        flash('Empty comment')
        return redirect(url_for('lesson_detail', lesson_id=lesson_id))
    comment = Comment(user_id=session['user_id'], lesson_id=lesson_id, content=content)
    db.session.add(comment)
    db.session.commit()
    flash('Comment added')
    return redirect(url_for('main.lesson_detail', lesson_id=lesson_id))


