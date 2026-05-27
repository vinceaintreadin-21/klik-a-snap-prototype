import { useState, useEffect } from "react";
import { useInstitutions } from "../../hooks/useInstitutions";
import InstitutionStatusBadge from "./InstitutionStatusBadge";

interface Props {
    onSuspend: (institution: any) => void
    onActivate: (institution: any) => void
    onCreate: () => void
}

const InstitutionTable = ({ onSuspend, onActivate, onCreate }: Props) => {
    const { institutions, loading, error, refetch } = useInstitutions();

    if (loading) return <div className="p-8 text-center text-gray-500">Loading institutions...</div>
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Institutions</h2>
                <button
                    onClick={onCreate}
                    className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition'
                >
                    + New Institution
                </button>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3 text-left">Institution</th>
                        <th className="px-6 py-3 text-left">Contact</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Created</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {institutions.map((inst) => (
                        <tr key={inst.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{inst.name}</div>
                                <div className="text-gray-400 text-xs">{inst.address}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-gray-700">{inst.contact_person}</div>
                                <div className="text-gray-400 text-xs">{inst.contact_email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <InstitutionStatusBadge status={inst.status} />
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {new Date(inst.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                                {inst.status === 'SUSPENDED' || inst.status === 'INACTIVE' ? (
                                    <button
                                        onClick={() => onActivate(inst)}
                                        className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
                                    >
                                        Activate
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onSuspend(inst)}
                                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                                    >
                                        Suspend
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {institutions.length === 0 && (
                <div className="p-8 text-center text-gray-400">No institutions found.</div>
            )}
        </div>
    )
}

export default InstitutionTable 