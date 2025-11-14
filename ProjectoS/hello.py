# -*- coding: utf-8 -*-
"""
Created on Thu Nov 13 18:49:11 2025

@author: Usuario Final
"""

from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<h1>HOLA MUNDO EN H1</h1>"