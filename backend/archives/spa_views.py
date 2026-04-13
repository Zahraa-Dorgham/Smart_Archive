"""
Views to serve the Angular SPA (Single Page Application)
"""
from django.views.generic import TemplateView
from django.conf import settings
from django.http import FileResponse
from pathlib import Path
import os


class IndexView(TemplateView):
    """Serve index.html for all SPA routes (client-side routing)"""
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


def serve_spa_file(request, filename=''):
    """
    Serve files from the Angular build output.
    Falls back to index.html for SPA routing.
    """
    # Build the path to the file
    build_path = Path(settings.BASE_DIR) / '../frontend/dist/frontend/browser'
    
    if filename:
        file_path = build_path / filename
    else:
        file_path = build_path / 'index.html'
    
    # If file doesn't exist, serve index.html (for SPA routing)
    if not file_path.exists():
        file_path = build_path / 'index.html'
    
    if file_path.exists():
        return FileResponse(open(file_path, 'rb'))
    
    # Fallback if nothing found
    from django.http import HttpResponse
    return HttpResponse('Angular app not built. Run "ng build" in the frontend directory.', status=404)
