<?php

namespace App\Http\Controllers;

use App\Models\ServiceCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceCategoryController extends Controller
{
    /**
     * Display a listing of service categories.
     */
    public function index(Request $request): Response
    {
        $query = ServiceCategory::query()->withCount('services');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $categories = $query->orderBy('name', 'asc')->paginate(15)->withQueryString();

        $stats = [
            'total' => ServiceCategory::count(),
            'active' => ServiceCategory::where('is_active', true)->count(),
            'inactive' => ServiceCategory::where('is_active', false)->count(),
        ];

        return Inertia::render('service-categories/index', [
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:service_categories,name'],
            'is_active' => ['boolean'],
        ]);

        ServiceCategory::create($validated);

        return redirect()->back()->with('success', 'Service category created successfully.');
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, ServiceCategory $serviceCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:service_categories,name,' . $serviceCategory->id],
            'is_active' => ['boolean'],
        ]);

        $serviceCategory->update($validated);

        return redirect()->back()->with('success', 'Service category updated successfully.');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(ServiceCategory $serviceCategory): RedirectResponse
    {
        if ($serviceCategory->services()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete service category assigned to existing client services/retainers.');
        }

        $serviceCategory->delete();

        return redirect()->back()->with('success', 'Service category deleted successfully.');
    }
}
