#!/usr/bin/env python
import os
import subprocess
import re
import argparse

_tmp_image = '/tmp/lowres.png'

parser = argparse.ArgumentParser(description='Reduce image quality.')
parser.add_argument('--filter', default='Point')
parser.add_argument('--src', default='originals')
parser.add_argument('--dst', default='pixelated')
parser.add_argument('--width', type=int, default=500)
parser.add_argument('--password', '-p', type=str, default=os.environ['UT_PASSWORD'])
opts = parser.parse_args()

# filters = ['Point', 'Hermite', 'Box', 'Cubic', 'Gaussian', 'Catrom', 'Triangle', 'Quadratic', 'Mitchell']

if not os.path.exists(opts.dst):
    os.makedirs(opts.dst)

def basename(filepath):
    filename = os.path.basename(filepath)
    return os.path.splitext(filename)[0]

def run(*args):
    str_args = map(str, args)
    # print '$ %s' % ' '.join(str_args)
    subprocess.check_output(str_args)

def resize(out_image, in_image, max_dim, filter_name):
    run('convert',
        '-type', 'GrayScaleMatte',
        '-filter', filter_name,
        '-resize', '%dx%d^' % (max_dim, max_dim),
        '-quality', 80,
        out_image, in_image)

def sequence(original_image):
    for width in [10, 25, 50, 75, 100, 150]:
        out = '%s/%s-%03d.jpg' % (opts.dst, basename(original_image), width)

        resize(original_image, _tmp_image, width, opts.filter)
        resize(_tmp_image, out, opts.width, opts.filter)

for original_name in os.listdir(opts.src):
    if re.search('(png|jpe?g)$', original_name):
        sequence('%s/%s' % (opts.src, original_name))
