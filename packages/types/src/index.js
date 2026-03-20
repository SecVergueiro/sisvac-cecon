"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusSolicitacao = exports.TipoVinculo = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["RH"] = "RH";
    UserRole["SERVIDOR"] = "SERVIDOR";
})(UserRole || (exports.UserRole = UserRole = {}));
var TipoVinculo;
(function (TipoVinculo) {
    TipoVinculo["ESTATUTARIO"] = "ESTATUTARIO";
    TipoVinculo["CONTRATADO"] = "CONTRATADO";
    TipoVinculo["COMISSIONADO"] = "COMISSIONADO";
})(TipoVinculo || (exports.TipoVinculo = TipoVinculo = {}));
var StatusSolicitacao;
(function (StatusSolicitacao) {
    StatusSolicitacao["PENDENTE"] = "PENDENTE";
    StatusSolicitacao["APROVADO"] = "APROVADO";
    StatusSolicitacao["REPROVADO"] = "REPROVADO";
    StatusSolicitacao["CANCELADO"] = "CANCELADO";
})(StatusSolicitacao || (exports.StatusSolicitacao = StatusSolicitacao = {}));
//# sourceMappingURL=index.js.map