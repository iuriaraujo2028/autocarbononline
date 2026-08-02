package com.autocarbon.erp.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    // Método que recebe o Lead do site e faz a Roleta (Round-Robin)
    @PostMapping("/distribuir")
    public String receberLead(@RequestBody LeadRequest request) {
        // 1. Busca os dados do cliente e salva na base ERP
        // 2. Busca o vendedor ativo que está há mais tempo sem receber lead
        // SELECT * FROM vendedores WHERE status = 'ATIVO' ORDER BY ultimo_lead_recebido ASC LIMIT 1
        
        Vendedor vendedorSorteado = obterProximoVendedor();
        
        // 3. Atualiza o timestamp do vendedor para o final da fila
        atualizarFilaVendedor(vendedorSorteado);
        
        // 4. Salva o Lead relacionando Cliente, Vendedor e Veículo
        salvarNovoLead(request.getClienteId(), vendedorSorteado.getId(), request.getVeiculoId());
        
        // 5. Retorna o telefone do vendedor para o frontend fazer o redirect do WhatsApp
        return "{"telefone_destino": "" + vendedorSorteado.getTelefone() + ""}";
    }

    private Vendedor obterProximoVendedor() {
        // Lógica de banco de dados simulada
        return new Vendedor(1, "Carlos", "5565999999999");
    }
    
    private void atualizarFilaVendedor(Vendedor v) { /* UPDATE SQL */ }
    private void salvarNovoLead(int cliente, int vendedor, int veiculo) { /* INSERT SQL */ }
}
